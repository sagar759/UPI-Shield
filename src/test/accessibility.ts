import { expect } from "vitest";
import { queryByRole } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
// @ts-expect-error dom-accessibility-api typings resolution in bundler environment
import { computeAccessibleName } from "dom-accessibility-api";

/**
 * Interface representing element targets for tab order validation.
 */
export type TargetSpecifier =
  | string
  | { role: string; name?: string | RegExp; selector?: string };

/**
 * Computes accessible name of an element using dom-accessibility-api.
 */
export function getAccessibleName(element: HTMLElement): string {
  return computeAccessibleName(element);
}

/**
 * Tests keyboard tab order through container elements in DOM sequence using userEvent.tab().
 * Isolates focus traversal within container boundaries.
 */
export async function testKeyboardTabOrder(
  container: HTMLElement,
  expectedTargets: TargetSpecifier[]
): Promise<void> {
  const user = userEvent.setup();
  const resolvedElements: HTMLElement[] = [];

  for (const target of expectedTargets) {
    let el: HTMLElement | null = null;

    if (typeof target === "string") {
      el = container.querySelector<HTMLElement>(target);
    } else {
      const options = target.name ? { name: target.name } : {};
      el =
        (queryByRole(container, target.role, options) as HTMLElement | null) ||
        (target.selector
          ? container.querySelector<HTMLElement>(target.selector)
          : null);
    }

    if (!el) {
      throw new Error(
        `testKeyboardTabOrder: could not find element matching ${JSON.stringify(
          target
        )}`
      );
    }

    resolvedElements.push(el);
  }

  if (resolvedElements.length === 0) return;

  // Insert a focusable sentinel immediately before the container to start tab traversal from outside
  const sentinel = document.createElement("button");
  sentinel.type = "button";
  sentinel.tabIndex = 0;
  sentinel.setAttribute("aria-label", "sentinel");

  if (container.parentNode) {
    container.parentNode.insertBefore(sentinel, container);
  } else {
    document.body.insertBefore(sentinel, document.body.firstChild);
  }

  sentinel.focus();
  expect(document.activeElement).toBe(sentinel);

  try {
    for (let i = 0; i < resolvedElements.length; i++) {
      await user.tab();
      expect(document.activeElement).toBe(resolvedElements[i]);
    }
  } finally {
    sentinel.remove();
  }
}

/**
 * Verifies focus visibility for an interactive element by inspecting rendered computed styles.
 */
export async function verifyFocusVisibility(element: HTMLElement): Promise<void> {
  // Capture pre-focus computed styles
  const preStyle = window.getComputedStyle(element);
  const preOutlineStyle = preStyle.outlineStyle || preStyle.getPropertyValue("outline-style") || "";
  const preOutlineWidth = preStyle.outlineWidth || preStyle.getPropertyValue("outline-width") || "0px";
  const preOutlineColor = preStyle.outlineColor || preStyle.getPropertyValue("outline-color") || "";
  const preBoxShadow = preStyle.boxShadow || preStyle.getPropertyValue("box-shadow") || "";

  const user = userEvent.setup();

  // Create sentinel element before target element to drive focus via keyboard tab
  const sentinel = document.createElement("button");
  sentinel.type = "button";
  sentinel.tabIndex = 0;
  sentinel.setAttribute("aria-label", "sentinel");

  if (element.parentNode) {
    element.parentNode.insertBefore(sentinel, element);
  } else {
    document.body.insertBefore(sentinel, document.body.firstChild);
  }

  sentinel.focus();

  try {
    await user.tab();
    expect(document.activeElement).toBe(element);
  } finally {
    sentinel.remove();
  }

  // Capture post-focus computed styles
  const postStyle = window.getComputedStyle(element);
  const postOutlineStyle =
    postStyle.outlineStyle ||
    postStyle.getPropertyValue("outline-style") ||
    element.style.outlineStyle ||
    "";
  const postOutlineWidth =
    postStyle.outlineWidth ||
    postStyle.getPropertyValue("outline-width") ||
    element.style.outlineWidth ||
    "1px";
  const postOutlineColor =
    postStyle.outlineColor ||
    postStyle.getPropertyValue("outline-color") ||
    element.style.outlineColor ||
    "";
  const postBoxShadow =
    postStyle.boxShadow ||
    postStyle.getPropertyValue("box-shadow") ||
    element.style.boxShadow ||
    "";

  const isPostOutlineVisible =
    postOutlineStyle !== "none" &&
    postOutlineStyle !== "" &&
    postOutlineStyle !== "initial" &&
    postOutlineWidth !== "0px" &&
    postOutlineColor !== "transparent" &&
    postOutlineColor !== "rgba(0, 0, 0, 0)";

  const isPostRingVisible =
    postBoxShadow !== "none" &&
    postBoxShadow !== "" &&
    postBoxShadow !== "initial";

  const preOutlineVisible =
    preOutlineStyle !== "none" &&
    preOutlineStyle !== "" &&
    preOutlineStyle !== "initial" &&
    preOutlineWidth !== "0px" &&
    preOutlineColor !== "transparent" &&
    preOutlineColor !== "rgba(0, 0, 0, 0)";

  const preRingVisible =
    preBoxShadow !== "none" &&
    preBoxShadow !== "" &&
    preBoxShadow !== "initial";

  const outlineChanged =
    postOutlineStyle !== preOutlineStyle ||
    postOutlineWidth !== preOutlineWidth ||
    postOutlineColor !== preOutlineColor;

  const boxShadowChanged = postBoxShadow !== preBoxShadow;

  const hasFocusSpecificChange =
    (isPostOutlineVisible && (outlineChanged || !preOutlineVisible)) ||
    (isPostRingVisible && (boxShadowChanged || !preRingVisible));

  expect(hasFocusSpecificChange).toBe(true);
}

/**
 * Asserts accessible name of an element matches expectation.
 */
export function verifyAccessibleName(
  element: HTMLElement,
  expectedName: string | RegExp
): void {
  const actualName = getAccessibleName(element);
  if (typeof expectedName === "string") {
    expect(actualName.trim().toLowerCase()).toBe(expectedName.trim().toLowerCase());
  } else {
    expect(actualName).toMatch(expectedName);
  }
}

/**
 * Verifies accessibility semantics of a dialog overlay.
 */
export function verifyDialogSemantics(
  dialogElement: HTMLElement,
  options?: { expectedRole?: "dialog" | "alertdialog"; expectLabel?: boolean }
): void {
  const expectedRole = options?.expectedRole || "dialog";
  const role = dialogElement.getAttribute("role");
  expect(role).toBe(expectedRole);

  const modal = dialogElement.getAttribute("aria-modal");
  expect(modal).toBe("true");

  if (options?.expectLabel !== false) {
    const hasLabel =
      dialogElement.hasAttribute("aria-label") ||
      dialogElement.hasAttribute("aria-labelledby");
    expect(hasLabel).toBe(true);
  }
}

/**
 * Verifies live region attributes for dynamic updates.
 */
export function verifyLiveRegion(
  element: HTMLElement,
  expectedMode: "polite" | "assertive" = "polite"
): void {
  const liveMode = element.getAttribute("aria-live");
  const role = element.getAttribute("role");

  if (expectedMode === "assertive") {
    const isAssertive = liveMode === "assertive" || role === "alert";
    expect(isAssertive).toBe(true);
  } else {
    const isPolite = liveMode === "polite" || role === "status";
    expect(isPolite).toBe(true);
  }
}

/**
 * Verifies status display conveys meaning independently of color alone.
 */
export function verifyColorIndependentStatus(element: HTMLElement): void {
  const textContent = (element.textContent || "").trim();
  const hasVisibleText = textContent.length > 0;

  const svgs = Array.from(element.querySelectorAll("svg"));
  const hasMeaningfulIcon = svgs.some((svg) => {
    const isHidden = svg.getAttribute("aria-hidden") === "true";
    if (isHidden) return false;
    const svgLabel =
      svg.getAttribute("aria-label") ||
      svg.querySelector("title")?.textContent ||
      "";
    return svgLabel.trim().length > 0;
  });

  expect(hasVisibleText || hasMeaningfulIcon).toBe(true);
}
