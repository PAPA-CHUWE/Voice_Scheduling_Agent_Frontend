/**
 * Lightweight date formatting (avoids date-fns bundle issues with Turbopack).
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions & { pattern?: "date" | "datetime" } = {}
): string {
  const d = typeof date === "object" && "getTime" in date ? date : new Date(date);
  const { pattern, ...opts } = options;
  const defaultOpts: Intl.DateTimeFormatOptions =
    pattern === "date"
      ? { dateStyle: "medium" }
      : pattern === "datetime"
        ? { dateStyle: "medium", timeStyle: "short" }
        : { dateStyle: "medium", timeStyle: "short" };
  return new Intl.DateTimeFormat(undefined, { ...defaultOpts, ...opts }).format(d);
}

/** Short format for tables: e.g. "Feb 20, 2027, 10:00 AM" */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, { pattern: "datetime" });
}

/** Date only: e.g. "Feb 20, 2027" */
export function formatDateOnly(date: Date | string): string {
  return formatDate(date, { pattern: "date" });
}
