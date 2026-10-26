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
let lastRequestId: string | string[] | undefined;
before(async () => {
  dependency = createServer((req, res) => {
    calls++;
    lastRequestId = req.headers["x-request-id"];
    res.setHeader("Content-Type", "application/json");
    if (req.url?.includes("missing")) {
      res.writeHead(404).end("{}");
      return;
    }
    if (req.url?.includes("offline")) {
      res.writeHead(500).end("{}");
      return;
    }
    if (req.url?.startsWith("/users/")) {
      const id = req.url.slice("/users/".length);
      res.end(
        JSON.stringify({
          id,
          address:
            id === "customer-delivery"
              ? {
                  postalCode: "00000000",
                  street: "Rua Fictícia",
                  city: "Cidade Demo",
                }
              : null,
        }),
      );
    } else {
      const id = req.url?.slice("/products/".length);
      res.end(
        JSON.stringify({
          id,
          priceCents: 4000,
          currency: "BRL",
          available: id !== "product-unavailable",
        }),
      );
    }
  });
  await new Promise<void>((resolve) =>
    dependency.listen(0, "127.0.0.1", resolve),
  );
  const url = `http://127.0.0.1:${(dependency.address() as AddressInfo).port}`;
  process.env.USERS_URL = url;
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
  customerId: "customer-pickup",
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
test("retirada sem endereço cria pedido de 8000 centavos", async () => {
  const result = await post(valid);
  assert.equal(result.status, 201);
  assert.equal(result.body.totalCents, 8000);
  assert.equal(result.body.deliveryAddress, null);
  assert.equal(lastRequestId, "checkout-test");
});
test("entrega exige endereço e preserva o cliente válido", async () => {
  const missing = await post({ ...valid, fulfillment: "delivery" });
  assert.equal(missing.status, 422);
  assert.equal(missing.body.error.code, "ADDRESS_REQUIRED");
  const delivery = await post({
    ...valid,
    customerId: "customer-delivery",
    fulfillment: "delivery",
  });
  assert.equal(delivery.status, 201);
  assert.equal(delivery.body.deliveryAddress.postalCode, "00000000");
});
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
    [{}, "CUSTOMER_NOT_FOUND"],
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
    [{ ...valid, customerId: "   " }, "CUSTOMER_NOT_FOUND"],
    [{ ...valid, customerId: 123 }, "CUSTOMER_NOT_FOUND"],
    [{ customerId: valid.customerId, fulfillment: "pickup" }, "EMPTY_CART"],
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
test("distingue ausência, indisponibilidade e falha de dependência", async () => {
  for (const [id, status, code] of [
    ["product-missing", 422, "PRODUCT_NOT_FOUND"],
    ["product-unavailable", 422, "PRODUCT_UNAVAILABLE"],
    ["product-offline", 503, "DEPENDENCY_UNAVAILABLE"],
  ] as const) {
    const result = await post({
      ...valid,
      items: [{ productId: id, quantity: 1 }],
    });
    assert.equal(result.status, status);
    assert.equal(result.body.error.code, code);
    assert.equal(result.body.requestId, "checkout-test");
  }
});
