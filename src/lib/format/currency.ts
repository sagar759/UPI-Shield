/**
 * Currency formatting utilities for Indian Rupee (INR).
 */

/**
 * Formats a numeric amount in full Indian numbering system format (e.g., ₹1,23,456.78).
 * Throws an error if the amount is not a finite number.
 *
 * @param amount - The numeric amount to format.
 * @param options - Configuration options.
 * @param options.includeSymbol - Whether to prepend the Rupee symbol (₹). Defaults to true.
 * @param options.decimals - Number of decimal places. Defaults to 2.
 * @returns The formatted currency string.
 */
export function formatRupeeFull(
  amount: number,
  options?: { includeSymbol?: boolean; decimals?: number }
): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new Error("Amount must be a finite number");
  }

  const includeSymbol = options?.includeSymbol ?? true;
  const decimals = options?.decimals ?? 2;

  const formatter = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });

  const formattedNumber = formatter.format(amount);
  return includeSymbol ? `₹${formattedNumber}` : formattedNumber;
}

/**
 * Formats a numeric amount compactly using Indian groupings (e.g., ₹1L for 1,00,000).
 * Throws an error if the amount is not a finite number.
 *
 * @param amount - The numeric amount to format.
 * @param options - Configuration options.
 * @param options.includeSymbol - Whether to prepend the Rupee symbol (₹). Defaults to true.
 * @returns The formatted compact currency string.
 */
export function formatRupeeCompact(
  amount: number,
  options?: { includeSymbol?: boolean }
): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new Error("Amount must be a finite number");
  }

  const includeSymbol = options?.includeSymbol ?? true;

  const formatter = new Intl.NumberFormat("en-IN", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2,
  });

  const formattedNumber = formatter.format(amount);
  return includeSymbol ? `₹${formattedNumber}` : formattedNumber;
}
