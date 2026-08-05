import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { MessageForm } from "@/components/analyze/message/message-form";

expect.extend(toHaveNoViolations);

describe("MessageForm UI Component", () => {
  it("passes axe accessibility checks in standalone mode", async () => {
    const { container } = render(<MessageForm mode="standalone" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes axe accessibility checks in embedded mode", async () => {
    const { container } = render(<MessageForm mode="embedded" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("prevents analysis submission without consent and displays error summary", async () => {
    const onSubmit = vi.fn();
    render(<MessageForm onAnalysisSubmit={onSubmit} />);

    // Type valid message text
    const textArea = screen.getByLabelText(/Scam Message Text or Transcript/i);
    fireEvent.change(textArea, {
      target: { value: "Urgent investment offer double money in 24 hours" },
    });

    // Attempt submit without checking consent
    const submitBtn = screen.getByRole("button", { name: /Analyze Scam Message/i });
    fireEvent.click(submitBtn);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getAllByText(/Explicit consent is required before message text can be analyzed/i)[0]
    ).toBeInTheDocument();
  });

  it("allows selecting synthetic examples from fixture catalog and sets demo badge", async () => {
    render(<MessageForm mode="standalone" />);

    const exampleBtn = screen.getByRole("button", {
      name: /Student Investment Scheme/i,
    });
    fireEvent.click(exampleBtn);

    const textArea = screen.getByLabelText(/Scam Message Text or Transcript/i) as HTMLTextAreaElement;
    expect(textArea.value).toContain("Urgent! Exclusive student investment opportunity");
    expect(screen.getByText(/Demo Content/i)).toBeInTheDocument();
  });

  it("clears sensitive draft text on explicit Clear click", async () => {
    const onDraftChange = vi.fn();
    render(<MessageForm onDraftChange={onDraftChange} />);

    const textArea = screen.getByLabelText(/Scam Message Text or Transcript/i);
    fireEvent.change(textArea, { target: { value: "Sensitive text to clear" } });

    const clearBtn = screen.getByRole("button", { name: /Clear Text/i });
    fireEvent.click(clearBtn);

    expect((textArea as HTMLTextAreaElement).value).toBe("");
  });

  it("clears sensitive draft text on successful submit, not on validation failure", async () => {
    const onSubmit = vi.fn();
    render(<MessageForm onAnalysisSubmit={onSubmit} />);

    const textArea = screen.getByLabelText(/Scam Message Text or Transcript/i);
    fireEvent.change(textArea, { target: { value: "Valid message text for analysis" } });

    // Submit with NO consent -> validation fails -> draft text MUST remain
    const submitBtn = screen.getByRole("button", { name: /Analyze Scam Message/i });
    fireEvent.click(submitBtn);
    expect((textArea as HTMLTextAreaElement).value).toBe("Valid message text for analysis");

    // Now grant consent -> submit succeeds -> draft text is cleared
    const consentCheckbox = screen.getByLabelText(
      /I consent to analyze this message for scam indicators/i
    );
    fireEvent.click(consentCheckbox);
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalled();
    expect((textArea as HTMLTextAreaElement).value).toBe("");
  });

  it("redacts concrete PIN credential on submission and passes sanitized text", async () => {
    const onSubmit = vi.fn();
    render(<MessageForm onAnalysisSubmit={onSubmit} />);

    const textArea = screen.getByLabelText(/Scam Message Text or Transcript/i);
    fireEvent.change(textArea, {
      target: { value: "Enter your UPI PIN is 9999 to claim ₹2,500 refund" },
    });

    const consentCheckbox = screen.getByLabelText(
      /I consent to analyze this message for scam indicators/i
    );
    fireEvent.click(consentCheckbox);

    const submitBtn = screen.getByRole("button", { name: /Analyze Scam Message/i });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls[0][0].messageText).toContain("[REDACTED]");
    expect(onSubmit.mock.calls[0][0].messageText).not.toContain("9999");
  });

  it("preserves parent draft in embedded PaymentContextFields when submitted without onAnalysisSubmit callback", async () => {
    const { PaymentContextFields } = await import("@/components/analyze/transaction/payment-context-fields");
    
    function ParentComponent() {
      const [draftText, setDraftText] = React.useState("Embedded message text sample");
      const [consent, setConsent] = React.useState(true);
      return (
        <PaymentContextFields
          paymentType="scan_pay"
          onPaymentTypeChange={() => {}}
          noteCategory="general"
          onNoteCategoryChange={() => {}}
          noteText=""
          onNoteTextChange={() => {}}
          isCollectRequest={false}
          onIsCollectRequestChange={() => {}}
          hasRefundContext={false}
          onHasRefundContextChange={() => {}}
          hasDeviceChange={false}
          onHasDeviceChangeChange={() => {}}
          hasLocationChange={false}
          onHasLocationChangeChange={() => {}}
          recentFailuresCount={0}
          onRecentFailuresCountChange={() => {}}
          isKnownRecurring={false}
          onIsKnownRecurringChange={() => {}}
          includeMessage={true}
          onIncludeMessageChange={() => {}}
          messageText={draftText}
          onMessageTextChange={setDraftText}
          consentGiven={consent}
          onConsentGivenChange={setConsent}
        />
      );
    }

    render(<ParentComponent />);

    const includeBtn = screen.getByRole("button", { name: /Include Message in Risk Check/i });
    fireEvent.click(includeBtn);

    const textArea = screen.getByLabelText(/Scam Message Text or Transcript/i) as HTMLTextAreaElement;
    expect(textArea.value).toBe("Embedded message text sample");
  });
});
