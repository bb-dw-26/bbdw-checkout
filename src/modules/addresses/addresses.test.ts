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
let providerCalls = 0;
let productCalls = 0;
let providerMode = "ok";
const envelopes: string[] = [];
const url = (server: Server) => `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
const listen = (server: Server) => new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
before(async () => {
  provider = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url?.startsWith("/products/")) {
      productCalls++;
      res.end(JSON.stringify({ id: "product-standard", priceCents: 4000, currency: "BRL", available: true }));
      return;
    }
    providerCalls++;
    if (providerMode === "timeout") return;
    if (providerMode === "offline") { res.writeHead(502).end("{}"); return; }
    res.end(JSON.stringify(providerMode === "missing" ? { erro: true } : {
      cep: "01001-000", logradouro: " Rua privada ", bairro: " Bairro privado ", localidade: " Cidade privada ", uf: "sp",
    }));
  });
  collector = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    envelopes.push(Buffer.concat(chunks).toString());
    res.writeHead(200, { "Content-Type": "application/json" }).end("{}");
  });
  await listen(provider); await listen(collector);
  process.env.CATALOG_URL = url(provider);
  process.env.VIACEP_BASE_URL = url(provider);
  process.env.SENTRY_DSN = `http://public@127.0.0.1:${(collector.address() as AddressInfo).port}/1`;
  process.env.SENTRY_RELEASE = "address-test";
  initTelemetry();
  app = await createApp(); await app.listen(0, "127.0.0.1"); base = await app.getUrl();
});
after(async () => {
  await app?.close(); await Sentry.close(2000);
  for (const server of [provider, collector]) {
    server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  for (const name of ["SENTRY_DSN", "CATALOG_URL", "VIACEP_BASE_URL", "CHECKOUT_DEMO_DELAY_MS"]) delete process.env[name];
});
const events = () => envelopes.flatMap((body) => body.split("\n").filter(Boolean).map((line) => JSON.parse(line))).filter((item) => item.exception);
test("CEP mascarado é normalizado e formato inválido não acessa o provedor", async () => {
  providerMode = "ok";
  const result = await fetch(`${base}/addresses/01001-000`);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { postalCode: "01001000", street: "Rua privada", neighborhood: "Bairro privado", city: "Cidade privada", state: "SP" });
  const before = providerCalls;
  for (const value of ["abc", "123456789", "01001%20000"]) {
    const invalid = await fetch(`${base}/addresses/${value}`);
    assert.equal(invalid.status, 422);
    assert.equal((await invalid.json()).error.code, "INVALID_POSTAL_CODE");
  }
  assert.equal(providerCalls, before);
});
test("falha de transporte e timeout de dois segundos retornam 503", async () => {
  for (const mode of ["offline", "timeout"]) {
    providerMode = mode;
    const start = Date.now();
    const result = await fetch(`${base}/addresses/01001000`);
    assert.equal(result.status, 503);
    assert.equal((await result.json()).error.code, "ADDRESS_LOOKUP_UNAVAILABLE");
    if (mode === "timeout") assert.ok(Date.now() - start >= 1900 && Date.now() - start < 4000);
  }
});
test("exceção inesperada do adaptador é capturada uma vez, sem endereço ou CEP", async () => {
  providerMode = "missing";
  await Sentry.flush(3000); const before = events().length;
  const result = await fetch(`${base}/addresses/99999999`, { headers: { "X-Request-ID": "lookup-test" } });
  await Sentry.flush(3000);
  // Erros tratados não geram incidente; exceções inesperadas devem ter captura única.
  if (result.status === 404) { assert.equal(events().length, before); return; }
  assert.equal(result.status, 500);
  const captured = events().slice(before);
  assert.equal(captured.length, 1);
  assert.equal(captured[0].tags.scenario, "CHK-004");
  assert.equal(captured[0].request, undefined);
  for (const privateValue of ["99999999", "01001000", "Rua privada", "Bairro privado", "Cidade privada", '"erro":true'])
    assert.ok(!JSON.stringify(captured).includes(privateValue));
});
test("CEP inexistente retorna 404 POSTAL_CODE_NOT_FOUND sem captura de erro", async () => {
  providerMode = "missing";
  await Sentry.flush(3000); const before = events().length;
  const result = await fetch(`${base}/addresses/99999999`);
  assert.equal(result.status, 404);
  assert.equal((await result.json()).error.code, "POSTAL_CODE_NOT_FOUND");
  await Sentry.flush(3000);
  assert.equal(events().length, before);
});
test("reserva, concorrência, captura única, replay e conflito com conteúdo diferente", async () => {
  process.env.CHECKOUT_DEMO_DELAY_MS = "150";
  const order = { fulfillment: "delivery", deliveryAddress: { postalCode: "01001-000", street: " Rua privada ", number: "s/n", city: "Cidade privada", state: "sp" }, items: [{ productId: "product-standard", quantity: 2 }] };
  const post = (body: unknown, key = "intent-secret") => fetch(`${base}/orders`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(body) });
  await Sentry.flush(3000); const before = events().length; const productsBefore = productCalls; const addressesBefore = providerCalls;
  // Espera só a entrada no servidor; o catálogo permanece depois do atraso reservado.
  const first = post(order);
  await new Promise((resolve) => setTimeout(resolve, 40));
  for (let i = 0; i < 3; i++) {
    const duplicate = await post(order);
    assert.equal(duplicate.status, 409);
    assert.equal((await duplicate.json()).error.code, "CHECKOUT_IN_PROGRESS");
  }
  const created = await first; assert.equal(created.status, 201); const original = await created.json();
  const replay = await post({ ...order, deliveryAddress: { ...order.deliveryAddress, postalCode: "01001000", street: "Rua privada", state: "SP", neighborhood: "", complement: "" } });
  assert.equal(replay.status, 201); assert.equal((await replay.json()).id, original.id);
  for (const changed of [ { ...order, fulfillment: "pickup" }, { ...order, items: [{ productId: "product-standard", quantity: 3 }] }, { ...order, deliveryAddress: { ...order.deliveryAddress, number: "42" } } ]) {
    const conflict = await post(changed); assert.equal(conflict.status, 409); assert.equal((await conflict.json()).error.code, "IDEMPOTENCY_CONFLICT");
  }
  assert.equal(productCalls, productsBefore + 1); assert.equal(providerCalls, addressesBefore);
  await Sentry.flush(3000); const captured = events().slice(before);
  assert.equal(captured.length, 1); assert.equal(captured[0].tags.scenario, "CHK-003");
  for (const value of ["intent-secret", "01001000", "Rua privada", "Cidade privada", '"deliveryAddress"']) assert.ok(!JSON.stringify(captured).includes(value));
  delete process.env.CHECKOUT_DEMO_DELAY_MS;
});
