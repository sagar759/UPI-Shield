import { describe, it, expect } from "vitest";
import {
  parseRupeeAmountInput,
  validateTransactionFormState,
  prefillFromContact,
  prefillFromScenario,
  buildTransactionCheckInput,
  createDefaultTransactionFormDraft,
  MAX_DEMO_TRANSACTION_AMOUNT,
} from "../lib/forms/transaction-form-state";
import { DEMO_CONTACTS } from "../data/demo/contacts";
import { DEMO_SCENARIOS } from "../data/demo/scenarios";
import { TransactionCheckInputSchema } from "../lib/contracts/schemas";

describe("transaction-form-state", () => {
  describe("parseRupeeAmountInput", () => {
    it("parses numeric strings cleanly", () => {
      expect(parseRupeeAmountInput("5000")).toEqual({ valid: true, value: 5000 });
      expect(parseRupeeAmountInput("1500.50")).toEqual({ valid: true, value: 1500.5 });
    });

    it("handles pasted commas and currency symbols safely", () => {
      expect(parseRupeeAmountInput("₹ 1,00,000")).toEqual({ valid: true, value: 100000 });
      expect(parseRupeeAmountInput("INR 50,000")).toEqual({ valid: true, value: 50000 });
      expect(parseRupeeAmountInput("Rs. 10,500.75")).toEqual({ valid: true, value: 10500.75 });
    });

    it("rejects zero and negative amounts", () => {
      expect(parseRupeeAmountInput("0").valid).toBe(false);
      expect(parseRupeeAmountInput("-500").valid).toBe(false);
    });

    it("rejects non-numeric, NaN, and Infinity inputs", () => {
      expect(parseRupeeAmountInput("abc").valid).toBe(false);
      expect(parseRupeeAmountInput("1.2.3").valid).toBe(false);
      expect(parseRupeeAmountInput("Infinity").valid).toBe(false);
    });

    it("rejects amounts exceeding the maximum demo limit", () => {
      const result = parseRupeeAmountInput(String(MAX_DEMO_TRANSACTION_AMOUNT + 1));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds maximum demo");
    });
  });

  describe("prefillFromContact", () => {
    it("prefills fields strictly from an approved synthetic demo contact", () => {
      const contact = DEMO_CONTACTS[0]; // Ramesh Verma
      const draft = prefillFromContact(contact);

      expect(draft.receiverInput).toBe(contact.vpa);
      expect(draft.contactId).toBe(contact.contactId);
      expect(draft.scenarioId).toBeUndefined();
      expect(draft.isKnownRecurring).toBe(true); // relationship > 30 days
    });
  });

  describe("prefillFromScenario", () => {
    it("prefills valid rent scenario accurately", () => {
      const rentScenario = DEMO_SCENARIOS.find((s) => s.scenarioId === "scenario-recurring-rent")!;
      const draft = prefillFromScenario(rentScenario);

      expect(draft.scenarioId).toBe("scenario-recurring-rent");
      expect(draft.amount).toBe(String(rentScenario.transactionInput.raw.amount));
      expect(draft.noteText).toBe(rentScenario.transactionInput.raw.note);
      expect(draft.isCollectRequest).toBe(false);
    });

    it("prefills investment scam scenario accurately", () => {
      const investScenario = DEMO_SCENARIOS.find((s) => s.scenarioId === "scenario-student-investment")!;
      const draft = prefillFromScenario(investScenario);

      expect(draft.scenarioId).toBe("scenario-student-investment");
      expect(draft.amount).toBe("5000");
      expect(draft.includeMessage).toBe(true);
    });

    it("prefills refund/collect scenario accurately", () => {
      const refundScenario = DEMO_SCENARIOS.find((s) => s.scenarioId === "scenario-refund-qr")!;
      const draft = prefillFromScenario(refundScenario);

      expect(draft.scenarioId).toBe("scenario-refund-qr");
      expect(draft.hasRefundContext).toBe(true);
      expect(draft.isCollectRequest).toBe(true);
    });
  });

  describe("validateTransactionFormState", () => {
    it("validates missing receiver and invalid amount on submission", () => {
      const draft = createDefaultTransactionFormDraft();
      const errors = validateTransactionFormState(draft, {}, true);

      expect(errors.receiverInput).toBeDefined();
      expect(errors.amount).toBeDefined();
    });

    it("detects sensitive secret terms (PIN/OTP/CVV) in note text", () => {
      const draft = {
        ...createDefaultTransactionFormDraft(),
        receiverInput: "ramesh.verma@okaxis",
        amount: "1000",
        noteText: "Here is my PIN 1234 to complete rent",
      };
      const errors = validateTransactionFormState(draft, { noteText: true }, false);

      expect(errors.noteText).toContain("sensitive secret terms");
    });
  });

  describe("buildTransactionCheckInput", () => {
    it("constructs and validates a Zod runtime contract TransactionCheckInput payload", () => {
      const draft = {
        ...createDefaultTransactionFormDraft(),
        receiverInput: "ramesh.verma@okaxis",
        amount: "25000",
        paymentType: "bank_transfer" as const,
        noteText: "Monthly rent payment",
        isKnownRecurring: true,
      };

      const result = buildTransactionCheckInput(draft);

      // Must pass Zod schema validation without throwing
      const parsed = TransactionCheckInputSchema.safeParse(result);
      expect(parsed.success).toBe(true);

      expect(result.raw.amount).toBe(25000);
      expect(result.raw.currency).toBe("INR");
      expect(result.raw.paymentType).toBe("bank_transfer");
      expect(result.features.isNewPayee).toBe(false);
    });
  });
});
