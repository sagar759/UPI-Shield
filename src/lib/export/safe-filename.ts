/**
 * Safe export filename generation utility.
 * Enforces allowlisted characters, allowlisted extensions, and max length bounds.
 */

const ALLOWED_EXTENSIONS = [".json", ".csv", ".pdf", ".txt"];
const DEFAULT_EXTENSION = ".json";
const MAX_FILENAME_LENGTH = 255;

/**
 * Generates a safe filename by allowlisting characters (a-zA-Z0-9_.-),
 * checking extensions, preventing consecutive separators, and enforcing length limits.
 *
 * @param baseName - The proposed filename base.
 * @param extension - The file extension (e.g. '.json' or 'json').
 * @param defaultName - Fallback name if the base becomes empty. Defaults to 'export'.
 * @returns A safe, cleaned filename.
 */
export function generateSafeFilename(
  baseName: string,
  extension: string,
  defaultName: string = "export"
): string {
  // Normalize extension format
  let ext = extension.trim().toLowerCase();
  if (ext && !ext.startsWith(".")) {
    ext = `.${ext}`;
  }

  // If extension is not in the allowlist, fallback to default .json
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    ext = DEFAULT_EXTENSION;
  }

  // Replace all non-allowlisted characters (everything except a-zA-Z0-9_.-) with dashes
  let cleanBase = baseName
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    // Collapse multiple consecutive dashes/dots
    .replace(/-+/g, "-")
    .replace(/\.+/g, ".")
    // Remove leading/trailing dots and dashes
    .replace(/^[-.]+/, "")
    .replace(/[-.]+$/, "")
    .trim();

  // Handle cases where the baseName is empty or becomes empty after filtering
  if (!cleanBase) {
    cleanBase = defaultName
      .trim()
      .replace(/[^a-zA-Z0-9_.-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/\.+/g, ".")
      .replace(/^[-.]+/, "")
      .replace(/[-.]+$/, "");
    if (!cleanBase) {
      cleanBase = "export";
    }
  }

  // Truncate to fit max filename length limits (cleanBase + ext <= 255)
  const allowedBaseLength = MAX_FILENAME_LENGTH - ext.length;
  if (cleanBase.length > allowedBaseLength) {
    cleanBase = cleanBase.substring(0, allowedBaseLength);
    // Remove any trailing dashes or dots resulting from truncation
    cleanBase = cleanBase.replace(/[-.]+$/, "");
  }

  return `${cleanBase}${ext}`;
}
