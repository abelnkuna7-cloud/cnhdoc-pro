import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applySafeDocumentPipeline,
  buildMissingInformationQuestion,
  buildPrompt,
  buildSafeDocumentContent,
  getMissingDocumentInformation,
  parseDocumentFields,
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
    assert.ok(content.includes("Prepared by: Cossa Nexus Holdings"));
    assert.ok(content.includes("Service: Office Renovation"));
    assert.ok(content.includes("Total: R125,000"));
    assert.ok(content.includes("Deposit: R62,500"));
    assert.ok(content.includes("Balance: R62,500"));
    assert.ok(content.includes("VAT treatment: Not specified."));
    assert.ok(content.includes("Quotation validity: 14 days"));
    assert.ok(!content.includes("CNH/QRN/001"));
    assert.ok(!content.includes("2024-02-20"));
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

  it("routes generate, regenerate, improve, and conversion-style drafts through the shared safe pipeline", () => {
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
    const unsafeDraft = `# Quotation\nDocument Number: CNH/QRN/001\nDate: 2024-02-20\nPrepared for: Cossa Nexus Holdings\nPrepared by: Cossa Nexus Holdings\nService: Office Renovation\nTotal: R125,000\nDeposit: R62,500\nBalance: R62,500\nVAT treatment: Not specified.\nQuotation validity: 14 days\nThis document is generated from information supplied by the user and should be reviewed before use.`;

    const safeResult = applySafeDocumentPipeline(input, serverDate, unsafeDraft);
    const parsed = parseDocumentFields("Client name: Cossa Nexus Holdings\nService: Office Renovation\nAmount: R125,000\nPayment terms: 50% deposit, balance on completion\nQuotation validity: 14 days");

    assert.equal(safeResult.usedFallback, true);
    assert.ok(safeResult.content.includes("Prepared by: Cossa Nexus Holdings"));
    assert.ok(!safeResult.content.includes("CNH/QRN/001"));
    assert.ok(!safeResult.content.includes("2024-02-20"));
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.fields["Client name"], "Cossa Nexus Holdings");
  });

  it("blocks an incomplete quotation and asks for the missing information", () => {
    const input = {
      company: "",
      documentType: "Quotation",
      fields: {},
    };

    const missing = getMissingDocumentInformation(input);
    const question = buildMissingInformationQuestion(input.documentType, missing);

    assert.ok(missing.includes("Issuing company name"));
    assert.ok(missing.includes("Client name"));
    assert.ok(missing.includes("Prices or quotation total"));
    assert.ok(missing.includes("VAT status (registered/not registered and inclusive/exclusive)"));
    assert.ok(question.includes("NexDocs will not create the quotation"));
    assert.ok(!question.includes("Total: R0"));
  });

  it("accepts a quotation only when its required commercial fields are supplied", () => {
    const input = {
      company: "Cossa Construction & DIYs",
      documentType: "Quotation",
      fields: {
        "Client name": "Mthembu Siyabonga",
        "Client address": "162 Olivenhoutbosch, Centurion",
        "Scope of work": "Partition drywall ceiling and flooring",
        Amount: "R7,114.60",
        "Payment terms": "50% deposit, balance on completion",
        "Quotation validity": "14 days",
        "VAT status": "Not VAT registered",
      },
    };

    assert.deepEqual(getMissingDocumentInformation(input), []);
  });
});
