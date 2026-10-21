import { test } from "node:test";
import assert from "node:assert/strict";
import { issueFromEvent, parseMetadata } from "./incident.mjs";
const release = "a".repeat(40);
const issue = { id: "42", permalink: "https://example.sentry.io/issues/42/" };
const event = { eventID: "b".repeat(32), release: { version: release }, tags: [
  { key: "service", value: "bbdw-checkout" }, { key: "scenario", value: "CHK-001" },
  { key: "demo_run", value: "ensaio-001" }, { key: "request_id", value: "request-42" },
], entries: [{ type: "exception", data: { values: [{ value: "private payload", stacktrace: { frames: [
  { filename: "app:///src/orders.js", lineNo: 123 }, { filename: "/private/path.js", lineNo: 99 },
] } }] } }] };
test("ponte usa só evento da release e execução selecionadas, sem copiar payloads", () => {
  const draft = issueFromEvent(issue, event, release, "ensaio-001");
  assert.equal(parseMetadata(draft.body).event, event.eventID);
  assert.ok(draft.body.includes("app:///src/orders.js:123"));
  assert.ok(!draft.body.includes("private"));
  assert.equal(issueFromEvent(issue, event, release, "outro-ensaio"), null);
  assert.equal(issueFromEvent(issue, event, "c".repeat(40), "ensaio-001"), null);
});
test("metadados e link externo precisam corresponder ao contrato da demo", () => {
  assert.throws(() => parseMetadata("issue comum"));
  assert.throws(() => issueFromEvent({ ...issue, permalink: "https://example.com" }, event, release, "ensaio-001"));
  assert.throws(() => parseMetadata(issueFromEvent(issue, event, release, "ensaio-001").body.replace("demo/chk-001", "main")));
});
