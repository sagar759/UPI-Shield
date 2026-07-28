import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { configureAxe } from "jest-axe";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AnalyzerWorkspace } from "@/components/analyze/analyzer-workspace";

// Mock next/navigation
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
];

const axe = configureAxe({
  rules: {
    "color-contrast": { enabled: false }, // Covered by Playwright Chromium E2E
  },
});

describe("AnalyzerWorkspace Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders transaction mode by default with segmented controls and 2-column layout", () => {
    render(<AnalyzerWorkspace />);

    expect(screen.getByRole("radiogroup", { name: /select risk analyzer mode/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /transaction/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { name: /transaction risk assessment/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /result & guidance/i })).toBeInTheDocument();
  });

  it("switches modes via mode control and preserves active selection", async () => {
    render(<AnalyzerWorkspace />);

    const messageRadio = screen.getByRole("radio", { name: /scam message/i });
    fireEvent.click(messageRadio);

    expect(messageRadio).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { name: /scam message inspector/i })).toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/analyze?mode=message", { scroll: false });
  });

  it("PRESERVES INDEPENDENT DRAFT STATES: draft inputs remain intact when switching modes", () => {
    render(<AnalyzerWorkspace />);

    // 1. Enter an amount in Transaction mode
    const amountInput = screen.getByLabelText(/transaction amount/i);
    fireEvent.change(amountInput, { target: { value: "15000" } });
    expect(amountInput).toHaveValue("15000");

    // 2. Switch to Scam message mode
    const messageRadio = screen.getByRole("radio", { name: /scam message/i });
    fireEvent.click(messageRadio);
    expect(screen.getByRole("heading", { name: /scam message inspector/i })).toBeInTheDocument();

    // 3. Enter message text in Scam message mode
    const messageInput = screen.getByLabelText(/scam message text/i);
    fireEvent.change(messageInput, { target: { value: "Pay immediate fee to clear digital arrest" } });
    expect(messageInput).toHaveValue("Pay immediate fee to clear digital arrest");

    // 4. Switch back to Transaction mode
    const transactionRadio = screen.getByRole("radio", { name: /transaction/i });
    fireEvent.click(transactionRadio);

    // 5. Verify transaction amount is preserved!
    const restoredAmountInput = screen.getByLabelText(/transaction amount/i);
    expect(restoredAmountInput).toHaveValue("15000");
  });

  it("normalizes initial search params from URL safely and prefers contact VPA for recipientVpa field", () => {
    mockSearchParams = new URLSearchParams("mode=pay-contact&contactId=contact_landlord_001");
    render(<AnalyzerWorkspace />);

    expect(screen.getByRole("radio", { name: /transaction/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/selected contact:/i)).toBeInTheDocument();
    expect(screen.getByText(/ramesh verma \(landlord\)/i)).toBeInTheDocument();

    const recipientInput = screen.getByLabelText(/recipient vpa or upi id/i);
    expect(recipientInput).toHaveValue("ramesh.verma@okaxis");
  });

  it("reconciles selected contact and activeMode when search state changes, preserving amount and note", () => {
    const { rerender } = render(<AnalyzerWorkspace />);

    const amountInput = screen.getByLabelText(/transaction amount/i);
    const noteInput = screen.getByLabelText(/note or transfer description/i);
    fireEvent.change(amountInput, { target: { value: "5000" } });
    fireEvent.change(noteInput, { target: { value: "Monthly Rent" } });

    // Simulate URL search state update to new contact
    mockSearchParams = new URLSearchParams("mode=pay-contact&contactId=contact_friend_rohit_001");
    rerender(<AnalyzerWorkspace />);

    const recipientInput = screen.getByLabelText(/recipient vpa or upi id/i);
    expect(recipientInput).toHaveValue("rohit.kumar@okicici");
    // Preserves unrelated transaction draft edits
    expect(amountInput).toHaveValue("5000");
    expect(noteInput).toHaveValue("Monthly Rent");
  });

  it("handles invalid mode string falling back safely without error", () => {
    mockSearchParams = new URLSearchParams("mode=invalid-mode-string-xyz");
    render(<AnalyzerWorkspace />);

    expect(screen.getByRole("radio", { name: /transaction/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { name: /transaction risk assessment/i })).toBeInTheDocument();
  });

  it("supports typed custom child form slots", () => {
    render(
      <AnalyzerWorkspace
        renderTransactionForm={({ draft, onChange }) => (
          <div data-testid="custom-tx-form">
            <span>Custom Form Amount: {draft.amount}</span>
            <button onClick={() => onChange({ amount: "5000" })}>Set 5000</button>
          </div>
        )}
      />
    );

    expect(screen.getByTestId("custom-tx-form")).toBeInTheDocument();
    expect(screen.getByText(/custom form amount:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /set 5000/i }));
    expect(screen.getByText(/custom form amount: 5000/i)).toBeInTheDocument();
  });

  it("passes accessibility check (axe)", async () => {
    const { container } = render(<AnalyzerWorkspace />);
    const results = await axe(container, { runOnly: { type: "tag", values: WCAG_TAGS } });
    expect(results.violations).toEqual([]);
  });
});
