/**
 * Input validation and normalization utilities.
 * Handles whitespace normalization, control character detection, invalid encoding rejection,
 * amount checks, timestamp bounds, and secret credential patterns.
 */

export interface ValidationErrorDetail {
  field: string;
  code: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationErrorDetail[];
}

/**
 * Normalizes whitespace by trimming and collapsing multiple spaces/tabs/newlines
 * into a single space.
 */
export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Checks for control characters (U+0000 to U+001F and U+007F to U+009F).
 * Allows tabs, carriage returns, and newlines in text.
 */
export function hasControlCharacters(text: string): boolean {
  // Matches U+0000 to U+001F (except \t, \n, \r) and U+007F to U+009F
  const controlRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/;
  return controlRegex.test(text);
}

/**
 * Checks for invalid Unicode encoding, e.g. unpaired surrogates.
 */
export function hasInvalidEncoding(text: string): boolean {
  try {
    encodeURIComponent(text);
    
    // Check for unpaired surrogates manually using regex
    const unpairedSurrogateRegex = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|([^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    if (unpairedSurrogateRegex.test(text)) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Pattern for concrete credential values associated with secret keywords (PIN, OTP, CVV, password, passcode).
 */
const CONCRETE_NUMERIC_SECRET_REGEX = /\b(pin|otp|cvv|passcode)\b[^\d\n]{0,30}\b\d{3,8}\b/gi;
const CONCRETE_NUMERIC_PREFIX_REGEX = /\b\d{3,8}\b[^\d\n]{0,30}\b(pin|otp|cvv|passcode)\b/gi;
const CONCRETE_PASSWORD_REGEX = /\b(password|passcode)\b[^\n]{0,20}(?:[:=]|\bis\b)\s*\S+/gi;
const RAW_CARD_NUMBER_REGEX = /\b\d(?:[ -]?\d){12,18}\b/g;

/**
 * Identifies and redacts concrete credential values (such as PIN, OTP, CVV, password values or raw card numbers)
 * while preserving ordinary mentions of secret terms.
 */
export function redactConcreteCredentials(text: string): string {
  if (!text) return text;
  return text
    .replace(CONCRETE_NUMERIC_SECRET_REGEX, "$1 [REDACTED]")
    .replace(CONCRETE_NUMERIC_PREFIX_REGEX, "[REDACTED] $1")
    .replace(CONCRETE_PASSWORD_REGEX, "$1: [REDACTED]")
    .replace(RAW_CARD_NUMBER_REGEX, "[REDACTED]");
}

/**
 * Detects concrete credential values or actual secret data in free-text fields.
 * Returns false for ordinary mentions of PIN, OTP, CVV, or password without actual credential values.
 */
export function detectForbiddenSecrets(text: string): boolean {
  if (!text) return false;
  const r1 = new RegExp(CONCRETE_NUMERIC_SECRET_REGEX.source, "i");
  const r2 = new RegExp(CONCRETE_NUMERIC_PREFIX_REGEX.source, "i");
  const r3 = new RegExp(CONCRETE_PASSWORD_REGEX.source, "i");
  const r4 = new RegExp(RAW_CARD_NUMBER_REGEX.source, "g");

  return r1.test(text) || r2.test(text) || r3.test(text) || r4.test(text);
}

/**
 * Validates a free-text input string.
 * Normalizes whitespace, checks boundaries, control characters, encoding, and forbidden secrets.
 */
export function validateStringInput(
  value: unknown,
  options: {
    fieldName: string;
    maxLength: number;
    minLength?: number;
    allowEmpty?: boolean;
    allowControlCharacters?: boolean;
  }
): { normalized?: string; errors: ValidationErrorDetail[] } {
  const errors: ValidationErrorDetail[] = [];
  const { fieldName, maxLength, minLength = 0, allowEmpty = false, allowControlCharacters = false } = options;

  if (value === undefined || value === null) {
    if (!allowEmpty) {
      errors.push({
        field: fieldName,
        code: "REQUIRED",
        message: `${fieldName} is required`,
      });
    }
    return { errors };
  }

  if (typeof value !== "string") {
    errors.push({
      field: fieldName,
      code: "INVALID_TYPE",
      message: `${fieldName} must be a string`,
    });
    return { errors };
  }

  if (!allowControlCharacters && hasControlCharacters(value)) {
    errors.push({
      field: fieldName,
      code: "CONTROL_CHARACTERS",
      message: `${fieldName} contains forbidden control characters`,
    });
  }

  if (hasInvalidEncoding(value)) {
    errors.push({
      field: fieldName,
      code: "INVALID_ENCODING",
      message: `${fieldName} contains invalid Unicode encoding`,
    });
  }

  if (detectForbiddenSecrets(value)) {
    errors.push({
      field: fieldName,
      code: "FORBIDDEN_SECRET",
      message: `${fieldName} contains sensitive secret terms (PIN, OTP, CVV, or password)`,
    });
  }

  const normalized = normalizeWhitespace(value);

  if (normalized.length === 0) {
    if (!allowEmpty) {
      errors.push({
        field: fieldName,
        code: "EMPTY",
        message: `${fieldName} cannot be empty`,
      });
    }
    return { normalized: "", errors };
  }

  if (normalized.length < minLength) {
    errors.push({
      field: fieldName,
      code: "TOO_SHORT",
      message: `${fieldName} must be at least ${minLength} characters`,
    });
  }

  if (normalized.length > maxLength) {
    errors.push({
      field: fieldName,
      code: "TOO_LONG",
      message: `${fieldName} must not exceed ${maxLength} characters`,
    });
  }

  return { normalized, errors };
}

/**
 * Validates a Rupee amount. Must be a finite number > 0.
 */
export function validateRupeeAmount(value: unknown, fieldName: string = "amount"): { amount?: number; errors: ValidationErrorDetail[] } {
  const errors: ValidationErrorDetail[] = [];

  if (value === undefined || value === null) {
    errors.push({
      field: fieldName,
      code: "REQUIRED",
      message: `${fieldName} is required`,
    });
    return { errors };
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push({
      field: fieldName,
      code: "INVALID_TYPE",
      message: `${fieldName} must be a finite number`,
    });
    return { errors };
  }

  if (value <= 0) {
    errors.push({
      field: fieldName,
      code: "INVALID_AMOUNT",
      message: `${fieldName} must be greater than zero`,
    });
    return { errors };
  }

  return { amount: value, errors };
}

/**
 * Validates a timestamp string.
 * Must be a valid ISO format, not in the future, and not before the NPCI UPI launch date (2016-04-11T00:00:00Z).
 */
export function validateTimestamp(value: unknown, fieldName: string = "timestamp"): { timestamp?: string; errors: ValidationErrorDetail[] } {
  const errors: ValidationErrorDetail[] = [];

  if (value === undefined || value === null) {
    errors.push({
      field: fieldName,
      code: "REQUIRED",
      message: `${fieldName} is required`,
    });
    return { errors };
  }

  if (typeof value !== "string") {
    errors.push({
      field: fieldName,
      code: "INVALID_TYPE",
      message: `${fieldName} must be a string`,
    });
    return { errors };
  }

  // Strict ISO 8601 validation with capture groups for components
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
  const match = value.match(isoRegex);
  if (!match) {
    errors.push({
      field: fieldName,
      code: "INVALID_FORMAT",
      message: `${fieldName} must match ISO 8601 format (YYYY-MM-DDTHH:MM:SS, optional fractional seconds, and either a Z suffix or ±HH:MM offset)`,
    });
    return { errors };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = parseInt(match[6], 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    errors.push({
      field: fieldName,
      code: "INVALID_FORMAT",
      message: `${fieldName} must be a valid date format`,
    });
    return { errors };
  }

  // Detect component overflow by constructing a UTC Date from components and comparing
  const utcTestDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    utcTestDate.getUTCFullYear() !== year ||
    utcTestDate.getUTCMonth() !== month - 1 ||
    utcTestDate.getUTCDate() !== day ||
    utcTestDate.getUTCHours() !== hour ||
    utcTestDate.getUTCMinutes() !== minute ||
    utcTestDate.getUTCSeconds() !== second
  ) {
    errors.push({
      field: fieldName,
      code: "INVALID_FORMAT",
      message: `${fieldName} contains overflowed calendar date/time components`,
    });
    return { errors };
  }

  const timestampMs = date.getTime();
  const now = Date.now();
  // Allow 5 minutes of clock drift in future
  if (timestampMs > now + 5 * 60 * 1000) {
    errors.push({
      field: fieldName,
      code: "FUTURE_TIMESTAMP",
      message: `${fieldName} cannot be in the future`,
    });
  }

  const upiLaunchMs = new Date("2016-04-11T00:00:00Z").getTime();
  if (timestampMs < upiLaunchMs) {
    errors.push({
      field: fieldName,
      code: "IMPOSSIBLE_TIMESTAMP",
      message: `${fieldName} cannot be before the UPI launch date (April 11, 2016)`,
    });
  }

  return { timestamp: value, errors: errors };
}
