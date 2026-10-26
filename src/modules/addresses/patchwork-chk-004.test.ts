import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { INestApplication } from "@nestjs/common";
import * as Sentry from "@sentry/node";
import { initTelemetry } from "../../common/telemetry/telemetry";
import { createApp } from "../../app";

let app: INestApplication;
let provider: Server;
let collector: Server;
let base: string;
const envelopes: string[] = [];
const port = (server: Server) => (server.address() as AddressInfo).port;
const listen = (server: Server) => new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

before(async () => {
  // ViaCEP responde 200 com {"erro": true} para CEP inexistente.
  provider = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ erro: true }));
  });
  collector = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    envelopes.push(Buffer.concat(chunks).toString());
    res.writeHead(200, { "Content-Type": "application/json" }).end("{}");
  });
  await listen(provider); await listen(collector);
  process.env.VIACEP_BASE_URL = `http://127.0.0.1:${port(provider)}`;
  process.env.SENTRY_DSN = `http://public@127.0.0.1:${port(collector)}/1`;
  process.env.SENTRY_RELEASE = "patchwork-chk-004-test";
  initTelemetry();
  app = await createApp(); await app.listen(0, "127.0.0.1"); base = await app.getUrl();
});

after(async () => {
  await app?.close(); await Sentry.close(2000);
  for (const server of [provider, collector]) {
    server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  for (const name of ["SENTRY_DSN", "VIACEP_BASE_URL", "SENTRY_RELEASE"]) delete process.env[name];
});

test("CEP inexistente retorna 404 POSTAL_CODE_NOT_FOUND sem captura de erro", async () => {
  await Sentry.flush(3000);
  const before = envelopes.length;
  const result = await fetch(`${base}/addresses/99999999`, { headers: { "X-Request-ID": "chk004-regression" } });
  assert.equal(result.status, 404);
  const body = await result.json();
  assert.equal(body.error.code, "POSTAL_CODE_NOT_FOUND");
  assert.equal(body.requestId, "chk004-regression");
  await Sentry.flush(3000);
  assert.equal(envelopes.length, before);
});
