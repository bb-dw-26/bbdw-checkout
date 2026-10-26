import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as Sentry from "@sentry/node";
import { ApiError } from "../http/exceptions/api.exception";
import { configureHttp } from "../http/configure-http";
import { HttpModule } from "../http/http.module";
import { initTelemetry } from "./telemetry";

@Controller()
class ProbeController {
  @Get("failure")
  failure() { throw new TypeError("Falha sintética de captura"); }
  @Get("invalid")
  invalid() { throw new ApiError(422, "EMPTY_CART", "Carrinho vazio."); }
}
@Module({ imports: [HttpModule], controllers: [ProbeController] })
class ProbeModule {}

test("HTTP 500 envia um evento por requisição, isolado e sem dados do cliente", async () => {
  const envelopes: string[] = [];
  const collector = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    envelopes.push(Buffer.concat(chunks).toString());
    response.writeHead(200, { "Content-Type": "application/json" }).end("{}");
  });
  await new Promise<void>((resolve) => collector.listen(0, "127.0.0.1", resolve));
  process.env.SENTRY_DSN = `http://public@127.0.0.1:${(collector.address() as AddressInfo).port}/1`;
  process.env.SENTRY_RELEASE = "test-release";
  process.env.SENTRY_ENVIRONMENT = "test";
  process.env.DEMO_SCENARIO = "SDK-SMOKE";
  process.env.DEMO_RUN_ID = "local-test";
  initTelemetry();
  const app = await NestFactory.create(ProbeModule, { logger: false });
  configureHttp(app);
  try {
    await app.listen(0, "127.0.0.1");
    const base = await app.getUrl();
    await Promise.all(["request-a", "request-b"].map(async (id) => {
      const response = await fetch(`${base}/failure?secret=never-publish`, {
        headers: { "X-Request-ID": id, Authorization: "Bearer never-publish", Cookie: "session=never-publish" },
      });
      assert.equal(response.status, 500);
      const body = await response.json();
      assert.equal(body.requestId, id);
      assert.equal(body.error.code, "INTERNAL_ERROR");
    }));
    assert.equal((await fetch(`${base}/invalid`)).status, 422);
    assert.equal(await Sentry.flush(3000), true);
    const events = envelopes.flatMap((envelope) => envelope.split("\n").filter(Boolean).map((line: string) => JSON.parse(line))).filter((item) => item.exception);
    assert.equal(events.length, 2);
    assert.deepEqual(events.map((event) => event.tags.request_id).sort(), ["request-a", "request-b"]);
    for (const event of events) {
      assert.equal(event.release, "test-release");
      assert.equal(event.environment, "test");
      assert.equal(event.tags.scenario, "SDK-SMOKE");
      assert.equal(event.tags.service, "bbdw-checkout");
      assert.equal(event.request, undefined);
      assert.equal(event.user, undefined);
      assert.ok(event.exception.values[0].stacktrace.frames.length > 0);
      assert.ok(!JSON.stringify(event).includes("never-publish"));
    }
  } finally {
    await app.close();
    await Sentry.close(2000);
    collector.closeAllConnections();
    await new Promise<void>((resolve) => collector.close(() => resolve()));
    delete process.env.SENTRY_DSN;
  }
});
