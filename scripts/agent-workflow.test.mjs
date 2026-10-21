import { test } from "node:test";
import assert from "node:assert/strict";
import { validateChanges } from "./agent-workflow.mjs";
test("aceita correção e teste novo, preservando testes existentes e infraestrutura", () => {
  assert.deepEqual(validateChanges("M\tsrc/orders.ts\nA\ttest/pickup.test.ts"), ["test/pickup.test.ts"]);
  for (const change of ["M\ttest/checkout.test.ts", "M\tsrc/telemetry.ts", "A\t.github/workflows/x.yml", "D\tsrc/orders.ts", "A\ttest/../x.test.ts"]) {
    assert.throws(() => validateChanges(`M\tsrc/orders.ts\nA\ttest/pickup.test.ts\n${change}`));
  }
  assert.throws(() => validateChanges("M\tsrc/orders.ts"));
});
