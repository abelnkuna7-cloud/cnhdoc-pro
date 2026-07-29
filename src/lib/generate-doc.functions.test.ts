import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPrompt,
  buildSafeDocumentContent,
  validateSafeDocumentContent,
} from "./generate-doc.functions";

describe("NexDocs document safety", () => {
  it("keeps the requested quotation input safe and deterministic", () => {
    const input = {
      company: "Cossa Nexus Holdings",
      documentType: "Quotation",
      fields: {
        "Client name": "Cossa Nexus Holdings",
        Service: "Office Renovation",
        Amount: "R125,000",
        "Payment terms": "50% deposit, balance on completion",
        "Quotation validity": "14 days",
      },
    };

    const serverDate = new Date("2026-07-29T00:00:00.000Z");
    const content = buildSafeDocumentContent(input, serverDate);
    const validationIssues = validateSafeDocumentContent(content, input, serverDate);

    assert.ok(content.includes("Prepared for: Cossa Nexus Holdings"));
    assert.ok(content.includes("Prepared by: [Issuing company details required]"));
    assert.ok(content.includes("Service: Office Renovation"));
    assert.ok(content.includes("Total: R125,000"));
    assert.ok(content.includes("Deposit: R62,500"));
    assert.ok(content.includes("Balance: R62,500"));
    assert.ok(content.includes("VAT treatment: Not specified."));
    assert.ok(content.includes("Quotation validity: 14 days"));
    assert.ok(!content.includes("VAT total"));
    assert.ok(!content.includes("CIDB"));
    assert.ok(!content.includes("NHBRC"));
    assert.ok(!content.includes("CIPC"));
    assert.ok(!content.includes("B-BBEE"));
    assert.ok(!content.includes("legally compliant"));
    assert.ok(!content.includes("#"));
    assert.ok(!content.includes("**"));
    assert.ok(!content.includes("***"));
    assert.ok(!content.includes("|"));

    assert.deepEqual(validationIssues, []);
    assert.ok(buildPrompt(input).includes("The current server date is"));
  });
});
