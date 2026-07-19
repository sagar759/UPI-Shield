/**
 * Privacy masking utilities for sensitive identifiers.
 * Ensures that masked output never reveals the full identifier,
 * while retaining enough context for human verification.
 */

/**
 * Masks Virtual Payment Addresses (VPAs) / UPI IDs.
 * Format: username@domain -> keeps first 2 chars of username, masks the rest of username, preserves domain.
 * Example: "samik@okaxis" -> "sa***@okaxis"
 */
export function maskVPA(vpa: string): string {
  const trimmed = vpa.trim();
  if (!trimmed) return "";

  const atIndex = trimmed.indexOf("@");
  if (atIndex === -1) {
    // If no @ is found, treat the whole string as a pseudonymous account ID
    return maskAccountID(trimmed);
  }

  const username = trimmed.substring(0, atIndex);
  const domain = trimmed.substring(atIndex); // includes '@'

  if (username.length === 0) {
    return domain;
  }
  if (username.length === 1) {
    return `*${domain}`;
  }
  if (username.length === 2) {
    return `${username[0]}*${domain}`;
  }

  // Keep first 2, mask the rest of the username
  const maskedUsername = username.slice(0, 2) + "*".repeat(username.length - 2);
  return `${maskedUsername}${domain}`;
}

/**
 * Masks Indian mobile numbers.
 * Masks the middle 6 digits of a 10-digit number.
 * Example: "+91 9876543210" -> "+91 98******10"
 * Example: "9876543210" -> "98******10"
 */
export function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";

  // Extract digits to identify the 10-digit core
  const digitsOnly = trimmed.replace(/\D/g, "");
  
  if (digitsOnly.length < 10) {
    // For short numbers, keep first and last char, mask the middle
    if (trimmed.length <= 2) {
      return "*".repeat(trimmed.length);
    }
    return trimmed[0] + "*".repeat(trimmed.length - 2) + trimmed[trimmed.length - 1];
  }

  // Identify core 10 digits from the right
  const core10 = digitsOnly.slice(-10);
  const prefixDigits = digitsOnly.slice(0, -10);

  const maskedCore = core10.slice(0, 2) + "******" + core10.slice(-2);

  // Attempt to preserve the country code and space format if present in the original input
  if (trimmed.startsWith("+")) {
    const countryCode = prefixDigits ? `+${prefixDigits}` : "+91";
    // Check if there was a space after country code
    const hasSpace = trimmed.includes(" ");
    return `${countryCode}${hasSpace ? " " : ""}${maskedCore}`;
  }

  // If no "+" prefix but has prefix digits (e.g., 919876543210)
  if (prefixDigits) {
    const hasSpace = trimmed.substring(0, trimmed.length - 10).includes(" ");
    return `${prefixDigits}${hasSpace ? " " : ""}${maskedCore}`;
  }

  return maskedCore;
}

/**
 * Masks transaction reference numbers (UTR, RRN, etc.).
 * Keeps the first 3 and last 3 characters, replaces the middle with asterisks.
 * Example: "123456789012" -> "123******012"
 */
export function maskTransactionRef(ref: string): string {
  const trimmed = ref.trim();
  if (!trimmed) return "";

  if (trimmed.length <= 6) {
    if (trimmed.length <= 2) {
      return "*".repeat(trimmed.length);
    }
    return trimmed[0] + "*".repeat(trimmed.length - 2) + trimmed[trimmed.length - 1];
  }

  const first3 = trimmed.slice(0, 3);
  const last3 = trimmed.slice(-3);
  const maskedLength = trimmed.length - 6;

  return `${first3}${"*".repeat(maskedLength)}${last3}`;
}

/**
 * Masks pseudonymous account/profile IDs.
 * Keeps the first 2 and last 4 characters, replaces the middle with asterisks.
 * Example: "ACC123456789" -> "AC******6789"
 */
export function maskAccountID(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) return "";

  if (trimmed.length <= 6) {
    if (trimmed.length <= 2) {
      return "*".repeat(trimmed.length);
    }
    return trimmed[0] + "*".repeat(trimmed.length - 2) + trimmed[trimmed.length - 1];
  }

  const first2 = trimmed.slice(0, 2);
  const last4 = trimmed.slice(-4);
  const maskedLength = trimmed.length - 6;

  return `${first2}${"*".repeat(maskedLength)}${last4}`;
}
