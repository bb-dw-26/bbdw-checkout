import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { INestApplication } from "@nestjs/common";
import { createApp } from "../../app";

let app: INestApplication;
let base: string;

before(async () => {
  app = await createApp();
  await app.listen(0, "127.0.0.1");
  base = await app.getUrl();
});

after(async () => {
  await app?.close();
});

test("módulo de saúde responde com o request ID propagado", async () => {
  const response = await fetch(`${base}/health`, {
    headers: { "X-Request-ID": "health-test" },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal(response.headers.get("X-Request-ID"), "health-test");
});

test("rota inexistente passa pelo filtro global e recebe um ID válido", async () => {
  const response = await fetch(`${base}/missing-route`, {
    headers: { "X-Request-ID": "invalid request id" },
  });
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error.code, "HTTP_404");
  assert.match(body.requestId, /^[a-f0-9-]{36}$/);
  assert.equal(body.requestId, response.headers.get("X-Request-ID"));
});

test("preflight recebe CORS e request ID antes de alcançar um controller", async () => {
  const origin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  const response = await fetch(`${base}/health`, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "GET",
      "X-Request-ID": "preflight-test",
    },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.equal(response.headers.get("X-Request-ID"), "preflight-test");
});
