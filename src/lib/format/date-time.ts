/**
 * Date and Time formatting utilities configured for India locale (en-IN)
 * and Asia/Kolkata timezone (UTC +5:30).
 */

/**
 * Converts various input representations to a valid Date object.
 * Throws an error if the conversion fails or results in an Invalid Date.
 */
export function toDateObject(value: Date | string | number): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Invalid Date object provided");
    }
    return value;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid numerical timestamp provided");
    }
    return date;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid date string provided");
    }
    return date;
  }

  throw new Error("Unsupported date input type");
}

/**
 * Formats a date/time using the en-IN locale and Asia/Kolkata timezone.
 *
 * @param date - Date object, ISO string, or numerical timestamp.
 * @param options - Custom Intl.DateTimeFormatOptions.
 * @returns The formatted date/time string.
 */
export function formatDateTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = toDateObject(date);
  const hasStyle = options && (options.dateStyle !== undefined || options.timeStyle !== undefined);

  const defaultOptions: Intl.DateTimeFormatOptions = hasStyle
    ? { timeZone: "Asia/Kolkata" }
    : {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };

  const formatter = new Intl.DateTimeFormat("en-IN", {
    ...defaultOptions,
    ...options,
    // Ensure timeZone cannot be overridden to prevent environment-dependent tests
    timeZone: "Asia/Kolkata",
  });

  return formatter.format(dateObj);
}

/**
 * Formats only the date portion (DD/MM/YYYY) for Asia/Kolkata.
 *
 * @param date - Date object, ISO string, or numerical timestamp.
 * @returns The formatted date string.
 */
export function formatDateOnly(date: Date | string | number): string {
  const dateObj = toDateObject(date);
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(dateObj);
}

/**
 * Formats only the time portion (HH:MM:SS AM/PM) for Asia/Kolkata.
 *
 * @param date - Date object, ISO string, or numerical timestamp.
 * @returns The formatted time string.
 */
export function formatTimeOnly(date: Date | string | number): string {
  const dateObj = toDateObject(date);
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return formatter.format(dateObj);
}
