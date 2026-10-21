export const repository = "bbdw-gh-action/bbw-checkout";
export const demoBranch = "demo/chk-001";
export function parseMetadata(body) {
  const match = body?.match(/<!-- bbw-sentry (\{[^\n]+\}) -->/);
  if (!match) throw new Error("Issue sem metadados bbw-sentry.");
  const data = JSON.parse(match[1]);
  if (!["release", "run", "sentryIssue", "event"].every((key) => typeof data[key] === "string") ||
      data.scenario !== "CHK-001" || data.branch !== demoBranch ||
      !/^[a-f0-9]{40}$/.test(data.release) || !/^[a-zA-Z0-9-]{1,64}$/.test(data.run) ||
      !/^\d+$/.test(data.sentryIssue) || !/^[a-f0-9]{32}$/.test(data.event)) {
    throw new Error("Metadados inválidos ou cenário fora do escopo.");
  }
  return data;
}

export function issueFromEvent(issue, event, release, run) {
  const tags = Object.fromEntries((event.tags ?? []).map(({ key, value }) => [key, value]));
  const eventRelease = typeof event.release === "string" ? event.release : event.release?.version;
  if (eventRelease !== release || tags.demo_run !== run || tags.scenario !== "CHK-001" || tags.service !== "bbw-checkout") return null;
  const metadata = { scenario: "CHK-001", branch: demoBranch, release, run, sentryIssue: String(issue.id), event: event.eventID };
  const marker = `<!-- bbw-sentry ${JSON.stringify(metadata)} -->`;
  parseMetadata(marker);
  const url = new URL(issue.permalink);
  if (url.protocol !== "https:" || !(url.hostname === "sentry.io" || url.hostname.endsWith(".sentry.io"))) throw new Error("URL Sentry inválida.");
  const frames = (event.entries ?? []).filter((entry) => entry.type === "exception")
    .flatMap((entry) => entry.data.values ?? []).flatMap((value) => value.stacktrace?.frames ?? [])
    .filter((frame) => /^(?:app:\/\/\/src\/[a-zA-Z0-9_-]+\.js|\.\.\/\.\.\/src\/[a-zA-Z0-9_-]+\.tsx?)$/.test(frame.filename) && Number.isInteger(frame.lineNo))
    .map((frame) => `${frame.filename}:${frame.lineNo}`);
  const requestId = /^[a-zA-Z0-9._-]{1,128}$/.test(tags.request_id) ? tags.request_id : "não disponível";
  return {
    title: "[Sentry][CHK-001] Retirada sem endereço retorna HTTP 500",
    body: `${marker}\n\n## Incidente\n\n[Sentry](${url.href}) · evento \`${metadata.event}\`\n\nRelease: \`${release}\` · ensaio: \`${run}\` · request ID: \`${requestId}\`\n\nA compra de retirada com o cliente sintético sem endereço falhou. A API Sentry confirmou um evento real do projeto dedicado; o payload abaixo é a fixture pública de reprodução.\n\n\`\`\`json\n{"customerId":"customer-pickup","fulfillment":"pickup","items":[{"productId":"product-standard","quantity":2}]}\n\`\`\`\n\nEnviar via POST /orders. Esperado: HTTP 201, totalCents=8000, deliveryAddress=null. Revisão afetada: \`${demoBranch}\`.\n\nFrames da aplicação no evento (com source maps quando disponíveis):\n\n${frames.length ? frames.map((frame) => `- ${frame}`).join("\n") : "Consultar a stack no evento Sentry."}\n\nSolicitação: reproduzir, corrigir e abrir PR com teste de regressão. Preservar entrega com endereço e erro 422 na entrega sem endereço. Informar se consultou docs/SOLUCOES.md. Não fazer merge ou deploy.\n`,
  };
}
