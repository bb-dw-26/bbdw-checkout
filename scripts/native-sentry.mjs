import { issueFromEvent, parseMetadata, repository } from "./incident.mjs";

export const sentryOrg = "bbdw-workshop-jj";
export const sentryProjectId = "4512294853869568";
export const sentryBot = { login: "sentry[bot]", id: 39604003 };

export function validateNativeIssue(issue) {
  if (issue.pull_request || issue.state !== "open" ||
      issue.user?.login !== sentryBot.login || issue.user?.id !== sentryBot.id || issue.user?.type !== "Bot" ||
      (issue.performed_via_github_app && issue.performed_via_github_app.id !== 12637)) {
    throw new Error("Somente issues abertas pelo GitHub App oficial do Sentry são aceitas.");
  }
  if (!["sentry", "agent:repair"].every((name) => issue.labels?.some((label) => label.name === name))) {
    throw new Error("Issue precisa das labels sentry e agent:repair.");
  }
  const ids = [...new Set([...String(issue.body).matchAll(/https:\/\/bbdw-workshop-jj\.sentry\.io\/issues\/(\d+)\/(?=[?\s)\]#]|$)/g)].map((match) => match[1]))];
  if (ids.length !== 1) throw new Error("Issue precisa apontar para um único incidente da organização Sentry da demo.");
  return ids[0];
}

export function validateInitiator(issue, eventName, actor, actorId, permission) {
  validateNativeIssue(issue);
  if (eventName === "issues" && actor === sentryBot.login && String(actorId) === String(sentryBot.id)) return;
  if (eventName === "workflow_dispatch" && ["admin", "maintain", "write"].includes(permission)) return;
  throw new Error("Execução exige o App Sentry ou disparo manual por colaborador com escrita.");
}

export async function resolveNativeIncident(issue, headSha, fetchSentry) {
  const id = validateNativeIssue(issue);
  const detail = await fetchSentry(`organizations/${sentryOrg}/issues/${id}/`);
  if (String(detail.id) !== id || String(detail.project?.id) !== sentryProjectId || detail.project?.slug !== "bbw-checkout") {
    throw new Error("Incidente não pertence ao projeto bbw-checkout da nova organização.");
  }
  const event = await fetchSentry(`organizations/${sentryOrg}/issues/${id}/events/latest/`);
  const tags = Object.fromEntries((event.tags ?? []).map(({ key, value }) => [key, value]));
  const draft = issueFromEvent({ id, permalink: `https://${sentryOrg}.sentry.io/issues/${id}/` }, event, headSha, tags.demo_run);
  if (!draft) throw new Error("Evento não corresponde a CHK-001, serviço ou SHA atual de demo/chk-001.");
  const metadata = parseMetadata(draft.body);
  return {
    number: issue.number, url: `https://github.com/${repository}/issues/${issue.number}`,
    title: draft.title, body: draft.body, metadata,
  };
}

export async function readSentry(path) {
  if (!process.env.SENTRY_AUTH_TOKEN) throw new Error("Configure SENTRY_AUTH_TOKEN nos secrets do checkout para validar o incidente.");
  const response = await fetch(`https://sentry.io/api/0/${path}`, {
    headers: { Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}` },
    redirect: "error", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Consulta Sentry falhou: HTTP ${response.status}.`);
  return response.json();
}
