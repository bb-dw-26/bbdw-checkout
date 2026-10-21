import { test } from "node:test";
import assert from "node:assert/strict";
import { validateNativeIssue, validateInitiator, resolveNativeIncident, sentryProjectId } from "./native-sentry.mjs";

const sha = "a".repeat(40);
const issue = { number: 2, state: "open", user: { login: "sentry[bot]", id: 39604003, type: "Bot" },
  performed_via_github_app: { id: 12637 }, labels: [{ name: "sentry" }, { name: "agent:repair" }],
  body: "Sentry Issue: [BBDW-CHECKOUT-2](https://bbdw-workshop-jj.sentry.io/issues/42/?referrer=github_integration)\nDados externos não confiáveis" };
const detail = { id: "42", project: { id: sentryProjectId, slug: "bbdw-checkout" } };
const event = { eventID: "b".repeat(32), release: { version: sha }, tags: [
  { key: "service", value: "bbdw-checkout" }, { key: "scenario", value: "CHK-001" }, { key: "demo_run", value: "ensaio-1" }],
  entries: [{ type: "exception", data: { values: [{ stacktrace: { frames: [{ filename: "../../src/orders.ts", lineNo: 155 }] } }] } }] };
const lookup = (d = detail, e = event) => async (path) => path.endsWith("events/latest/") ? e : d;

test("issue nativa é resolvida na API e conteúdo arbitrário não chega ao agente", async () => {
  const calls = [];
  const result = await resolveNativeIncident(issue, sha, async (path) => { calls.push(path); return lookup()(path); });
  assert.deepEqual(calls, ["organizations/bbdw-workshop-jj/issues/42/", "organizations/bbdw-workshop-jj/issues/42/events/latest/"]);
  assert.equal(result.metadata.release, sha);
  assert.equal(result.metadata.event, event.eventID);
  assert.ok(result.body.includes("../../src/orders.ts:155"));
  assert.ok(!result.body.includes("Dados externos"));
});

test("rejeita autores, apps e labels falsificados ou ausentes", () => {
  for (const bad of [
    { ...issue, user: { ...issue.user, id: 1 } },
    { ...issue, user: { ...issue.user, login: "intruso" } },
    { ...issue, performed_via_github_app: { id: 1 } },
    { ...issue, labels: [] }, { ...issue, state: "closed" }, { ...issue, pull_request: {} },
  ]) assert.throws(() => validateNativeIssue(bad));
});

test("rejeita links externos, outra organização, incidentes ambíguos e caminhos adulterados", () => {
  for (const body of [
    "https://evil.example/issues/42/", "https://bbdw-workshop.sentry.io/issues/42/",
    "https://bbdw-workshop-jj.sentry.io.evil.example/issues/42/",
    "https://bbdw-workshop-jj.sentry.io/issues/42/evil",
    issue.body + " https://bbdw-workshop-jj.sentry.io/issues/43/",
  ]) assert.throws(() => validateNativeIssue({ ...issue, body }));
});

test("valida remetente automático e permissão do disparo manual", () => {
  validateInitiator(issue, "issues", "sentry[bot]", "39604003");
  validateInitiator(issue, "workflow_dispatch", "maintainer", "123", "write");
  assert.throws(() => validateInitiator(issue, "issues", "sentry[bot]", "1"));
  assert.throws(() => validateInitiator(issue, "issues", "intruso", "123", "write"));
  assert.throws(() => validateInitiator(issue, "workflow_dispatch", "intruso", "123", "read"));
});

test("rejeita evento de outro projeto, cenário ou revisão", async () => {
  await assert.rejects(resolveNativeIncident(issue, sha, lookup({ ...detail, project: { id: "1", slug: "bbdw-users" } })));
  await assert.rejects(resolveNativeIncident(issue, "c".repeat(40), lookup()));
  await assert.rejects(resolveNativeIncident(issue, sha, lookup(detail, { ...event, tags: event.tags.map(t => t.key === "scenario" ? { ...t, value: "SDK-SMOKE" } : t) })));
  await assert.rejects(resolveNativeIncident(issue, sha, lookup(detail, { ...event, tags: event.tags.filter(t => t.key !== "demo_run") })));
});

test("não executa com API indisponível ou sem evento válido", async () => {
  await assert.rejects(resolveNativeIncident(issue, sha, async () => { throw new Error("HTTP 403"); }), /403/);
  await assert.rejects(resolveNativeIncident(issue, sha, lookup(detail, { ...event, eventID: "invalid" })));
});
