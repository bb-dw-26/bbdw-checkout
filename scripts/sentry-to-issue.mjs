// Ponte local: inicia antes da apresentação e não exige serviço público adicional.
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { setTimeout } from "node:timers/promises";
import { issueFromEvent, repository } from "./incident.mjs";
const { values } = parseArgs({ options: {
  org: { type: "string", default: process.env.SENTRY_BRIDGE_ORG },
  release: { type: "string", default: process.env.SENTRY_BRIDGE_RELEASE },
  run: { type: "string", default: process.env.SENTRY_BRIDGE_RUN },
  publish: { type: "boolean", default: false }, watch: { type: "boolean", default: false },
} });
if (!/^[a-z0-9-]+$/.test(values.org ?? "") || !/^[a-f0-9]{40}$/.test(values.release ?? "") || !/^[a-zA-Z0-9-]{1,64}$/.test(values.run ?? "")) {
  throw new Error("Informe --org ORGANIZACAO --release SHA_COMPLETO --run ENSAIO. Acrescente --publish para criar a issue; --watch para consultar por até 60 minutos.");
}
if (!process.env.SENTRY_AUTH_TOKEN) throw new Error("Configure SENTRY_AUTH_TOKEN localmente, com leitura de eventos.");
function gh(args, input) {
  return JSON.parse(execFileSync("gh", args, { encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] }));
}
async function sentry(path) {
  const response = await fetch(`https://sentry.io/api/0/${path}`, {
    headers: { Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}` }, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Sentry retornou HTTP ${response.status}.`);
  return response.json();
}
const controller = new AbortController();
process.once("SIGINT", () => controller.abort());
process.once("SIGTERM", () => controller.abort());
const deadline = Date.now() + 60 * 60 * 1000;
const project = await sentry(`projects/${values.org}/bbw-checkout/`);
do {
  const query = new URLSearchParams({ project: project.id, query: `release:${values.release} demo_run:${values.run} scenario:CHK-001`, statsPeriod: "24h" });
  const issues = await sentry(`organizations/${values.org}/issues/?${query}`);
  for (const issue of issues) {
    // Grupos podem conter vários ensaios. Jamais publicar um evento de outra execução.
    const event = await sentry(`organizations/${values.org}/issues/${issue.id}/events/latest/`);
    const draft = issueFromEvent(issue, event, values.release, values.run);
    if (!draft) continue;
    if (!values.publish) { console.log(JSON.stringify(draft, null, 2)); continue; }
    const marker = draft.body.split("\n")[0];
    const existing = gh(["issue", "list", "--repo", repository, "--state", "all", "--limit", "1000", "--json", "body,url"])
      .find((item) => item.body.includes(`"release":"${values.release}","run":"${values.run}","sentryIssue":"${issue.id}"`));
    if (existing) { console.log(`Issue já registrada: ${existing.url}`); continue; }
    const created = gh(["api", `repos/${repository}/issues`, "--method", "POST", "--input", "-"], JSON.stringify({ ...draft, labels: ["sentry", "agent:repair"] }));
    console.log(`Issue criada: ${created.html_url}`);
    if (!created.body?.includes(marker)) throw new Error("Não foi possível confirmar o registro da issue.");
  }
  if (!values.watch || controller.signal.aborted) break;
  try { await setTimeout(5000, undefined, { signal: controller.signal }); } catch { break; }
} while (Date.now() < deadline);
