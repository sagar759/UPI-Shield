import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  testKeyboardTabOrder,
  verifyFocusVisibility,
  getAccessibleName,
  verifyAccessibleName,
  verifyDialogSemantics,
  verifyLiveRegion,
  verifyColorIndependentStatus,
} from "./accessibility";

describe("Accessibility Test Helpers", () => {
  it("verifies keyboard tab order correctly across sequence using userEvent.tab()", async () => {
    const { container } = render(
      <div>
        <button id="btn-1">First</button>
        <a href="#link" id="link-1">
          Second Link
        </a>
        <input id="input-1" aria-label="Third input" />
      </div>
    );

    await testKeyboardTabOrder(container, [
      "#btn-1",
      { role: "link", name: "Second Link" },
      { role: "textbox", name: "Third input" },
    ]);
  });

  it("verifies focus visibility on interactive elements with computed styles", async () => {
    render(
      <button
        onFocus={(e) => {
          e.currentTarget.style.outlineStyle = "solid";
          e.currentTarget.style.outlineWidth = "3px";
          e.currentTarget.style.outlineColor = "#8ab4f8";
        }}
      >
        Click Me
      </button>
    );
    const button = screen.getByRole("button", { name: "Click Me" });
    await verifyFocusVisibility(button);
  });

  it("computes and verifies accessible names accurately via dom-accessibility-api", () => {
    render(
      <div>
        <button aria-label="Close dialog">X</button>
        <span id="label-id">Username</span>
        <input aria-labelledby="label-id" />
      </div>
    );

    const closeBtn = screen.getByRole("button", { name: "Close dialog" });
    verifyAccessibleName(closeBtn, "Close dialog");

    const textInput = screen.getByRole("textbox", { name: "Username" });
    expect(getAccessibleName(textInput)).toBe("Username");
  });

  it("verifies dialog semantics", () => {
    render(
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm Action"
        id="modal-1"
      >
        <h2>Confirmation</h2>
      </div>
    );
    const dialog = screen.getByRole("dialog");
    verifyDialogSemantics(dialog, { expectedRole: "dialog" });
  });

  it("verifies live region configuration", () => {
    render(
      <div>
        <div id="polite-1" role="status" aria-live="polite">
          Update available
        </div>
        <div id="assertive-1" role="alert">
          Critical alert
        </div>
      </div>
    );

    const politeEl = document.getElementById("polite-1")!;
    const assertiveEl = document.getElementById("assertive-1")!;

    verifyLiveRegion(politeEl, "polite");
    verifyLiveRegion(assertiveEl, "assertive");
  });

  it("verifies color-independent status presentation with text or non-decorative icon", () => {
    render(
      <div className="bg-state-success text-state-success p-2">
        <svg aria-hidden="true" width="16" height="16"><circle cx="8" cy="8" r="8"/></svg>
        <span>Low Risk</span>
      </div>
    );
    const statusEl = screen.getByText("Low Risk").parentElement!;
    verifyColorIndependentStatus(statusEl);
  });
});
