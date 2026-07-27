import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Search, Check } from "lucide-react";

import { cn, classNames } from "@/lib/ui/class-names";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { TextLink } from "@/components/ui/text-link";
import { FieldMessage } from "@/components/ui/field-message";
import { ErrorSummary } from "@/components/ui/error-summary";
import { TextField } from "@/components/ui/text-field";
import { AmountField } from "@/components/ui/amount-field";
import { TextArea } from "@/components/ui/text-area";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio-group";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Panel } from "@/components/ui/panel";
import { Divider } from "@/components/ui/divider";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";

expect.extend(toHaveNoViolations);

describe("class-names helper", () => {
  it("concatenates and merges Tailwind class names correctly", () => {
    expect(cn("px-2 py-1", "bg-red-500", "px-4")).toBe("py-1 bg-red-500 px-4");
    expect(classNames("text-sm", false && "hidden")).toBe("text-sm");
  });
});

describe("Button primitive", () => {
  it("renders a semantic button with children and primary variant styling", () => {
    render(<Button variant="primary">Click Me</Button>);
    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("min-h-[44px]");
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("prevents activation when isLoading or disabled", async () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button isLoading onClick={handleClick}>
        Loading
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();

    rerender(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders left and right icons as decorative elements", () => {
    const { container } = render(
      <Button
        leftIcon={<Search data-testid="left-icon" />}
        rightIcon={<Check data-testid="right-icon" />}
      >
        Search
      </Button>
    );

    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(2);
    svgs.forEach((svg) => {
      expect(svg.parentElement).toHaveAttribute("aria-hidden", "true");
    });
  });
});

describe("IconButton primitive", () => {
  it("renders an icon-only button with accessible name and tooltip title", () => {
    render(
      <IconButton
        label="Search transactions"
        icon={<Search data-testid="search-icon" />}
      />
    );

    const button = screen.getByRole("button", { name: "Search transactions" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("title", "Search transactions");
    expect(button.className).toContain("min-h-[44px]");
  });

  it("shows loading spinner when isLoading is true", () => {
    render(
      <IconButton
        label="Refreshing data"
        isLoading
        icon={<Search />}
      />
    );

    const button = screen.getByRole("button", { name: "Refreshing data" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});

describe("TextLink primitive", () => {
  it("renders internal Next.js link", () => {
    render(<TextLink href="/activity">View Activity</TextLink>);
    const link = screen.getByRole("link", { name: "View Activity" });
    expect(link).toHaveAttribute("href", "/activity");
    expect(link.className).toContain("min-h-[44px]");
  });

  it("renders external link with target and rel attributes", () => {
    render(
      <TextLink href="https://cybercrime.gov.in" isExternal>
        Cybercrime Portal
      </TextLink>
    );
    const link = screen.getByRole("link", { name: /Cybercrime Portal/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("handles disabled state gracefully", async () => {
    const handleClick = vi.fn();
    render(
      <TextLink href="/test" disabled onClick={handleClick}>
        Disabled Link
      </TextLink>
    );
    const link = screen.getByRole("link", { name: "Disabled Link" });
    expect(link).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(link);
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe("FieldMessage primitive", () => {
  it("renders default helper text", () => {
    render(<FieldMessage id="helper-1">Enter your 10-digit phone number</FieldMessage>);
    const msg = screen.getByText("Enter your 10-digit phone number");
    expect(msg).toBeInTheDocument();
    expect(msg).not.toHaveAttribute("role", "alert");
  });

  it("renders error message with role='alert'", () => {
    render(
      <FieldMessage id="error-1" variant="error">
        Invalid VPA format
      </FieldMessage>
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Invalid VPA format");
  });
});

describe("ErrorSummary primitive", () => {
  it("renders form-level error list and moves focus when clicked", async () => {
    const errors = [
      { fieldId: "amount-input", message: "Amount must be greater than zero" },
      { fieldId: "vpa-input", message: "VPA format is invalid" },
    ];

    render(
      <div>
        <ErrorSummary errors={errors} />
        <input id="amount-input" data-testid="amount-input" />
        <input id="vpa-input" data-testid="vpa-input" />
      </div>
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("There is a problem")).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: "Amount must be greater than zero",
    });

    await userEvent.click(link);
    expect(screen.getByTestId("amount-input")).toHaveFocus();
  });

  it("returns null if errors array is empty", () => {
    const { container } = render(<ErrorSummary errors={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("TextField primitive", () => {
  it("renders input with visible label, description, and required indicator", () => {
    render(
      <TextField
        id="payee-vpa"
        label="Payee VPA"
        description="Example: merchant@upi"
        required
      />
    );

    const label = screen.getByText("Payee VPA");
    expect(label).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();

    const input = screen.getByRole("textbox", { name: /Payee VPA/i });
    expect(input).toHaveAttribute("id", "payee-vpa");
    expect(input).toHaveAttribute("aria-describedby", "payee-vpa-desc");
  });

  it("links error message via aria-invalid and aria-describedby", () => {
    render(
      <TextField
        id="payee-vpa"
        label="Payee VPA"
        error="Payee address is required"
      />
    );

    const input = screen.getByRole("textbox", { name: /Payee VPA/i });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "payee-vpa-error");
    expect(screen.getByRole("alert")).toHaveTextContent("Payee address is required");
  });
});

describe("AmountField primitive", () => {
  it("renders Rupee prefix and decimal inputMode", () => {
    render(
      <AmountField
        id="txn-amount"
        label="Transaction Amount"
        placeholder="100.00"
      />
    );

    expect(screen.getByText("₹")).toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: /Transaction Amount/i });
    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(input.className).toContain("tabular-nums");
  });
});

describe("TextArea primitive", () => {
  it("renders multi-line textarea with label and error state", () => {
    render(
      <TextArea
        id="complaint-details"
        label="Complaint Description"
        rows={6}
        error="Description is too short"
      />
    );

    const textarea = screen.getByRole("textbox", { name: /Complaint Description/i });
    expect(textarea).toHaveAttribute("rows", "6");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Select primitive", () => {
  it("renders native select dropdown with options", async () => {
    const options = [
      { label: "Transaction", value: "txn" },
      { label: "Scam Text", value: "text" },
      { label: "Receiver", value: "rcv" },
    ];

    render(
      <Select
        id="analyzer-type"
        label="Analyzer Mode"
        options={options}
        defaultValue="text"
      />
    );

    const select = screen.getByRole("combobox", { name: /Analyzer Mode/i });
    expect(select).toHaveValue("text");

    await userEvent.selectOptions(select, "rcv");
    expect(select).toHaveValue("rcv");
  });
});

describe("Checkbox primitive", () => {
  it("renders checkbox with clickable label and toggle state", async () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        id="terms-check"
        label="I consent to retain transaction evidence"
        onChange={handleChange}
      />
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /I consent to retain transaction evidence/i,
    });
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
  });

  it("supports indeterminate state", () => {
    render(
      <Checkbox
        id="selectAll"
        label="Select All"
        indeterminate
      />
    );

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });
});

describe("RadioGroup primitive", () => {
  it("renders fieldset with legend and options, supporting radio change", async () => {
    const handleChange = vi.fn();
    const options = [
      { value: "low", label: "Low risk policy" },
      { value: "medium", label: "Medium risk policy" },
      { value: "high", label: "High risk policy" },
    ];

    render(
      <RadioGroup
        name="riskPolicy"
        legend="Risk Policy Level"
        options={options}
        defaultValue="low"
        onChange={handleChange}
      />
    );

    expect(screen.getByText("Risk Policy Level")).toBeInTheDocument();
    const lowRadio = screen.getByRole("radio", { name: /Low risk policy/i });
    const highRadio = screen.getByRole("radio", { name: /High risk policy/i });

    expect(lowRadio).toBeChecked();

    await userEvent.click(highRadio);
    expect(highRadio).toBeChecked();
    expect(handleChange).toHaveBeenCalledWith("high");
  });

  it("supports custom id, tabIndex=-1 for fieldset, required radio inputs, and unselected initialization", () => {
    const options = [
      { value: "opt1", label: "Option 1" },
      { value: "opt2", label: "Option 2" },
    ];

    const { container } = render(
      <RadioGroup
        id="custom-group-id"
        name="testGroup"
        legend="Select Option"
        options={options}
        required
        description="Select one"
        aria-describedby="external-help"
      />
    );

    const fieldset = container.querySelector("fieldset");
    expect(fieldset).toHaveAttribute("id", "custom-group-id");
    expect(fieldset).toHaveAttribute("tabindex", "-1");
    expect(fieldset).toHaveAttribute(
      "aria-describedby",
      "external-help custom-group-id-desc"
    );

    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(2);
    expect(radios[0]).toHaveAttribute("required");
    expect(radios[1]).toHaveAttribute("required");
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).not.toBeChecked();
  });
});

describe("SegmentedControl primitive", () => {
  it("renders three real radio buttons with keyboard navigation", async () => {
    const handleChange = vi.fn();
    const options = [
      { value: "txn", label: "Transaction" },
      { value: "text", label: "Scam Text" },
      { value: "rcv", label: "Receiver Flow" },
    ];

    render(
      <SegmentedControl
        options={options}
        value="txn"
        onChange={handleChange}
        label="Analyzer Segment Selection"
      />
    );

    const group = screen.getByRole("radiogroup", {
      name: "Analyzer Segment Selection",
    });
    expect(group).toBeInTheDocument();

    const txnBtn = screen.getByRole("radio", { name: "Transaction" });
    const textBtn = screen.getByRole("radio", { name: "Scam Text" });

    expect(txnBtn).toHaveAttribute("aria-checked", "true");
    expect(textBtn).toHaveAttribute("aria-checked", "false");

    // Click navigation
    await userEvent.click(textBtn);
    expect(handleChange).toHaveBeenCalledWith("text");

    // Keyboard navigation (ArrowRight)
    fireEvent.keyDown(txnBtn, { key: "ArrowRight" });
    expect(handleChange).toHaveBeenCalledWith("text");
  });

  it("skips disabled options during keyboard traversal", () => {
    const handleChange = vi.fn();
    const options = [
      { value: "opt1", label: "Option 1" },
      { value: "opt2", label: "Option 2", disabled: true },
      { value: "opt3", label: "Option 3" },
    ];

    render(
      <SegmentedControl
        options={options}
        value="opt1"
        onChange={handleChange}
      />
    );

    const opt1Btn = screen.getByRole("radio", { name: "Option 1" });
    fireEvent.keyDown(opt1Btn, { key: "ArrowRight" });
    expect(handleChange).toHaveBeenCalledWith("opt3");
  });
});

describe("Panel primitive", () => {
  it("renders container surface with specified semantic HTML element tag", () => {
    render(
      <Panel as="section" variant="bordered" aria-label="Panel Section">
        <h2>Panel Heading</h2>
      </Panel>
    );

    const section = screen.getByRole("region", { name: "Panel Section" });
    expect(section.tagName.toLowerCase()).toBe("section");
    expect(screen.getByText("Panel Heading")).toBeInTheDocument();
  });
});

describe("Divider primitive", () => {
  it("renders horizontal line and optional label", () => {
    const { container, rerender } = render(<Divider />);
    expect(container.querySelector("hr")).toBeInTheDocument();

    rerender(<Divider label="OR" />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.getByText("OR")).toBeInTheDocument();
  });
});

describe("StatusBadge primitive", () => {
  it("renders text and icon without relying on color alone", () => {
    render(<StatusBadge variant="high" label="High Risk" />);
    expect(screen.getByText("High Risk")).toBeInTheDocument();
    const badge = screen.getByText("High Risk").parentElement;
    expect(badge?.querySelector("svg")).toBeInTheDocument();
  });
});

describe("ProgressBar primitive", () => {
  it("renders progress element with aria attributes and visible percentage", () => {
    render(
      <ProgressBar
        value={75}
        max={100}
        label="Risk Score"
        variant="high"
      />
    );

    const progressbar = screen.getByRole("progressbar", { name: "Risk Score" });
    expect(progressbar).toHaveAttribute("aria-valuenow", "75");
    expect(progressbar).toHaveAttribute("aria-valuetext", "75%");
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Risk Score")).toBeInTheDocument();
  });
});

describe("Accessibility checks on form primitives", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(
      <main>
        <form>
          <TextField id="name" label="Full Name" required />
          <AmountField id="amount" label="Payment Amount" required />
          <Select
            id="type"
            label="Payment Type"
            options={[{ label: "P2P", value: "p2p" }]}
          />
          <Checkbox id="confirm" label="Confirm transaction" />
          <StatusBadge variant="low" />
          <ProgressBar value={20} label="Coverage" />
        </form>
      </main>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
