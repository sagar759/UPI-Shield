import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { TransactionForm } from "../components/analyze/transaction/transaction-form";
import { DEMO_CONTACTS } from "../data/demo/contacts";

expect.extend(toHaveNoViolations);

describe("TransactionForm Component", () => {
  it("renders form fields correctly with accessible default markup", async () => {
    const { container } = render(<TransactionForm />);

    expect(screen.getByLabelText(/Recipient VPA or UPI ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Transaction Amount/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluate Transaction Risk/i)).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("handles valid rent scenario submission", async () => {
    const handleSubmit = vi.fn();
    render(<TransactionForm onRiskInputSubmit={handleSubmit} />);

    // Select contact
    const receiverInput = screen.getByLabelText(/Recipient VPA or UPI ID/i);
    await userEvent.type(receiverInput, DEMO_CONTACTS[0].vpa);

    // Enter amount
    const amountInput = screen.getByLabelText(/Transaction Amount/i);
    await userEvent.type(amountInput, "25000");

    // Select rent category
    const noteInput = screen.getByLabelText(/Payment Note \/ Description/i);
    await userEvent.type(noteInput, "Rent for July 2026");

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /Evaluate Transaction Risk/i });
    await userEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submittedInput = handleSubmit.mock.calls[0][0];

    expect(submittedInput.raw.amount).toBe(25000);
    expect(submittedInput.raw.currency).toBe("INR");
    expect(submittedInput.raw.note).toBe("Rent for July 2026");
  });

  it("handles scenario prefill for student investment scam", async () => {
    const handleSubmit = vi.fn();
    render(
      <TransactionForm
        scenarioId="scenario-student-investment"
        onRiskInputSubmit={handleSubmit}
      />
    );

    expect(screen.getByLabelText(/Transaction Amount/i)).toHaveValue("5000");
    expect(screen.getByText(/Prefilled from synthetic demo scenario ID/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Evaluate Transaction Risk/i });
    await userEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit.mock.calls[0][0].raw.amount).toBe(5000);
  });

  it("handles collect request and refund context toggles", async () => {
    const handleSubmit = vi.fn();
    render(<TransactionForm onRiskInputSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText(/Recipient VPA or UPI ID/i), "guptamart@upi");
    await userEvent.type(screen.getByLabelText(/Transaction Amount/i), "1200");

    // Check collect request and refund context
    const collectCheckbox = screen.getByLabelText(/This is a UPI collect request/i);
    const refundCheckbox = screen.getByLabelText(/Associated with refund or cashback claim/i);

    await userEvent.click(collectCheckbox);
    await userEvent.click(refundCheckbox);

    await userEvent.click(screen.getByRole("button", { name: /Evaluate Transaction Risk/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submittedInput = handleSubmit.mock.calls[0][0];
    expect(submittedInput.features.isCollectRequest).toBe(true);
    expect(submittedInput.features.hasRefundContext).toBe(true);
  });

  it("shows error summary and prevents submission on invalid amount and missing receiver", async () => {
    const handleSubmit = vi.fn();
    render(<TransactionForm onRiskInputSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole("button", { name: /Evaluate Transaction Risk/i });
    await userEvent.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();

    expect(
      screen.getByText(/Please resolve the following issues before scoring transaction risk/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Recipient VPA, UPI ID, or contact is required/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Amount is required/i)[0]).toBeInTheDocument();
  });

  it("rejects hostile text input containing secret terms (PIN/OTP/CVV)", async () => {
    const handleSubmit = vi.fn();
    render(<TransactionForm onRiskInputSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText(/Recipient VPA or UPI ID/i), "test@upi");
    await userEvent.type(screen.getByLabelText(/Transaction Amount/i), "500");
    await userEvent.type(
      screen.getByLabelText(/Payment Note \/ Description/i),
      "Secret pin is 9999"
    );

    await userEvent.click(screen.getByRole("button", { name: /Evaluate Transaction Risk/i }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText(/contains sensitive secret terms/i)[0]).toBeInTheDocument();
  });
});

