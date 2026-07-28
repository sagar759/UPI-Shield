import { render, screen } from "@testing-library/react";
import { configureAxe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { PaymentActions } from "@/components/home/payment-actions";
import { PeopleRow } from "@/components/home/people-row";
import { ContactItem } from "@/components/home/contact-item";
import { DEMO_CONTACTS } from "@/data/demo/contacts";

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

describe("Payment Actions & Contact Selection Components", () => {
  describe("PaymentActions", () => {
    it("renders all four payment shortcuts with correct hrefs and simulated labels", () => {
      render(<PaymentActions />);

      expect(screen.getByRole("heading", { name: "Quick Payment Actions" })).toBeVisible();
      expect(screen.getByText(/Simulated checks • No money moved/i)).toBeVisible();

      // Four shortcuts check
      const scanLink = screen.getByRole("link", { name: /Scan & pay/i });
      expect(scanLink).toHaveAttribute("href", "/analyze?mode=scan-pay");

      const contactLink = screen.getByRole("link", { name: /Pay contact/i });
      expect(contactLink).toHaveAttribute("href", "/analyze?mode=pay-contact");

      const bankLink = screen.getByRole("link", { name: /Bank transfer/i });
      expect(bankLink).toHaveAttribute("href", "/analyze?mode=bank-transfer");

      const checkUpiLink = screen.getByRole("link", { name: /Check UPI ID/i });
      expect(checkUpiLink).toHaveAttribute("href", "/analyze?mode=check-upi-id");
    });

    it("renders Demo Scenarios entry point trigger", () => {
      render(<PaymentActions />);

      const demoLink = screen.getByRole("link", { name: /Explore Demo Scenarios/i });
      expect(demoLink).toBeVisible();
      expect(demoLink).toHaveAttribute("href", "/analyze?mode=demo-scenarios");
    });

    it("passes axe accessibility checks", async () => {
      const { container } = render(<PaymentActions />);
      const results = await axe(container, { runOnly: { type: "tag", values: WCAG_TAGS } });
      expect(results.violations).toEqual([]);
    });
  });

  describe("ContactItem", () => {
    it("renders contact initials, displayName, masked VPA, and verified merchant badge", () => {
      const merchantContact = DEMO_CONTACTS.find((c) => c.isVerifiedMerchant)!;
      render(<ContactItem contact={merchantContact} />);

      expect(screen.getByText(merchantContact.displayName)).toBeVisible();
      // VPA should be masked in UI
      expect(screen.getByText(/gu\*+@upi/i)).toBeVisible();
      // Should display verified merchant indicator
      expect(screen.getByTitle("Verified Merchant")).toBeVisible();
    });

    it("generates href with synthetic contactId and NEVER unmasked VPA", () => {
      const contact = DEMO_CONTACTS[0]; // Ramesh Verma
      render(<ContactItem contact={contact} />);

      const link = screen.getByRole("link");
      const href = link.getAttribute("href");

      expect(href).toBe(`/analyze?mode=pay-contact&contactId=${contact.contactId}`);
      expect(href).not.toContain(contact.vpa);
      expect(href).not.toContain("@");
    });
  });

  describe("PeopleRow", () => {
    it("renders header and all synthetic contact cards in horizontal container", () => {
      render(<PeopleRow contacts={DEMO_CONTACTS} />);

      expect(screen.getByRole("heading", { name: "People & Recent Contacts" })).toBeVisible();
      expect(screen.getByText(`${DEMO_CONTACTS.length} Contacts`)).toBeVisible();

      DEMO_CONTACTS.forEach((contact) => {
        expect(screen.getByText(contact.displayName)).toBeVisible();
      });
    });

    it("uses singular Contact label when contacts array length is 1", () => {
      render(<PeopleRow contacts={[DEMO_CONTACTS[0]]} />);
      expect(screen.getByText("1 Contact")).toBeVisible();
    });

    it("passes axe accessibility checks", async () => {
      const { container } = render(<PeopleRow contacts={DEMO_CONTACTS} />);
      const results = await axe(container, { runOnly: { type: "tag", values: WCAG_TAGS } });
      expect(results.violations).toEqual([]);
    });
  });
});
