import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { INestApplication } from "@nestjs/common";
import { createApp } from "../../../app";

let app: INestApplication;
let dependency: Server;
let base: string;
let calls = 0;
before(async () => {
  dependency = createServer((req, res) => {
    calls++;
    res.setHeader("Content-Type", "application/json");
    if (req.url?.includes("missing")) {
      res.writeHead(404).end("{}");
      return;
    }
    if (req.url?.includes("offline")) {
      res.writeHead(500).end("{}");
      return;
    }
    const id = req.url?.slice("/products/".length);
    res.end(JSON.stringify({ id, priceCents: 4000, currency: "BRL", available: id !== "product-unavailable" }));
  });
  await new Promise<void>((resolve) =>
    dependency.listen(0, "127.0.0.1", resolve),
  );
  const url = `http://127.0.0.1:${(dependency.address() as AddressInfo).port}`;
  process.env.CATALOG_URL = url;
  app = await createApp();
  await app.listen(0, "127.0.0.1");
  base = await app.getUrl();
});
after(async () => {
  await app?.close();
  await new Promise<void>((resolve, reject) =>
    dependency?.close((error) => (error ? reject(error) : resolve())),
  );
});
const valid = {
  deliveryAddress: null,
  fulfillment: "pickup",
  items: [{ productId: "product-standard", quantity: 2 }],
};
async function post(body: unknown) {
  const response = await fetch(`${base}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": "checkout-test",
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
test("carrinho vazio é rejeitado antes das dependências", async () => {
  const before = calls;
  const result = await post({ ...valid, items: [] });
  assert.equal(result.status, 422);
  assert.equal(result.body.error.code, "EMPTY_CART");
  assert.equal(calls, before);
});
test("valida quantidade, duplicidade, modalidade e corpo", async () => {
  for (const [body, code] of [
    [
      { ...valid, items: [{ productId: "product-standard", quantity: 1.5 }] },
      "INVALID_QUANTITY",
    ],
    [
      { ...valid, items: [...valid.items, ...valid.items] },
      "DUPLICATE_PRODUCT",
    ],
    [{ ...valid, fulfillment: "unknown" }, "INVALID_FULFILLMENT"],
    [{}, "INVALID_FULFILLMENT"],
  ] as const) {
    const result = await post(body);
    assert.equal(result.status, 422);
    assert.equal(result.body.error.code, code);
  }
});
test("JSON primitivo é rejeitado pelo parser HTTP com envelope 400", async () => {
  const result = await post(null);
  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, "HTTP_400");
  assert.equal(result.body.requestId, "checkout-test");
});

test("DTOs rejeitam campos ausentes, tipos incorretos e itens aninhados sem consultar dependências", async () => {
  const cases: [unknown, string][] = [
    [{ fulfillment: "pickup" }, "EMPTY_CART"],
    [{ ...valid, items: null }, "EMPTY_CART"],
    [{ ...valid, items: {} }, "EMPTY_CART"],
    [{ ...valid, items: [null] }, "PRODUCT_NOT_FOUND"],
    [{ ...valid, items: ["product-standard"] }, "PRODUCT_NOT_FOUND"],
    [{ ...valid, items: [[valid.items[0]]] }, "PRODUCT_NOT_FOUND"],
    [{ ...valid, items: [{ productId: " ", quantity: 1 }] }, "PRODUCT_NOT_FOUND"],
    [{ ...valid, items: [{ productId: 123, quantity: 1 }] }, "PRODUCT_NOT_FOUND"],
    ...[undefined, null, "2", true, 0, 100, 1.5].map((quantity): [unknown, string] => [
      { ...valid, items: [{ productId: "product-standard", quantity }] },
      "INVALID_QUANTITY",
    ]),
  ];
  const before = calls;
  for (const [body, code] of cases) {
    const result = await post(body);
    assert.equal(result.status, 422, JSON.stringify(body));
    assert.equal(result.body.error.code, code, JSON.stringify(body));
    assert.equal(result.body.requestId, "checkout-test");
  }
  assert.equal(calls, before);
});

test("retirada não depende de perfil nem consulta CEP; aceita chamadas sem chave", async () => {
  const result = await post(valid);
  assert.equal(result.status, 201);
  assert.equal(result.body.deliveryAddress, null);
  assert.equal(result.body.totalCents, 8000);
  assert.ok(!("customerId" in result.body));
});
test("entrega valida endereço e usa os dados informados sem consultar CEP", async () => {
  assert.equal((await post({ ...valid, fulfillment: "delivery" })).body.error.code, "ADDRESS_REQUIRED");
  const address = { postalCode: "01001-000", street: " Rua de Teste ", number: "s/n", city: " Cidade ", state: "sp" };
  for (const field of ["postalCode", "street", "number", "city", "state"]) {
    const result = await post({ ...valid, fulfillment: "delivery", deliveryAddress: { ...address, [field]: "" } });
    assert.equal(result.status, 422, field);
    assert.equal(result.body.error.code, "INVALID_ADDRESS", field);
  }
  const before = calls;
  const result = await post({ ...valid, fulfillment: "delivery", deliveryAddress: address });
  assert.equal(result.status, 201);
  assert.equal(calls, before + 1);
  assert.deepEqual(result.body.deliveryAddress, { ...address, postalCode: "01001000", street: "Rua de Teste", city: "Cidade", state: "SP" });
});
test("catálogo indisponível e produto ausente preservam o contrato", async () => {
  for (const [id, status] of [["offline", 503], ["missing", 422], ["product-unavailable", 422]] as const) {
    assert.equal((await post({ ...valid, items: [{ productId: id, quantity: 1 }] })).status, status);
  }
});
