/**
 * Defensive natural-language date/time parsing for voice input.
 * Handles common patterns; returns null on failure.
 */

const DEFAULT_TZ = "Africa/Harare";
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
  april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
  august: 7, aug: 7, september: 8, sep: 8, october: 9, oct: 9,
  november: 10, nov: 10, december: 11, dec: 11,
};

function parseTimePart(text: string): { hours: number; minutes: number } | null {
  const t = text.toLowerCase().trim();
  // "3pm", "3 pm", "3:30pm", "15:00", "10am"
  const amPm = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(t);
  if (!amPm) return null;
  let hours = parseInt(amPm[1], 10);
  const minutes = amPm[2] ? parseInt(amPm[2], 10) : 0;
  const meridiem = (amPm[3] || "").toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (!meridiem && hours <= 23 && minutes <= 59) {
    // 24h format
  } else if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

function parseDatePart(text: string, base: Date): Date | null {
  const t = text.toLowerCase().trim();
  const now = new Date(base);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (t.includes("tomorrow")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (t.includes("today")) return new Date(today);

  // "next monday", "next tuesday"
  const nextDay = /next\s+(\w+)/.exec(t);
  if (nextDay) {
    const dayName = nextDay[1];
    const idx = WEEKDAYS.findIndex((d) => d.startsWith(dayName));
    if (idx >= 0) {
      const d = new Date(today);
      let diff = idx - d.getDay();
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() + diff);
      return d;
    }
  }

  // "february 21", "feb 21 2026", "21 feb", "2/21/2026"
  for (const [name, month] of Object.entries(MONTHS)) {
    if (!t.includes(name)) continue;
    const numMatch = /(\d{1,2})(?:\s+(?:of\s+)?(\d{4}))?|(\d{4})\s+(?:of\s+)?(\d{1,2})/.exec(t) ||
      /(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/.exec(t);
    if (numMatch) {
      let day: number;
      let year: number = now.getFullYear();
      if (numMatch[4]) {
        day = parseInt(numMatch[4], 10);
        year = parseInt(numMatch[3], 10);
        if (year < 100) year += 2000;
      } else if (numMatch[2]) {
        day = parseInt(numMatch[1], 10);
        year = parseInt(numMatch[2], 10);
        if (year < 100) year += 2000;
      } else if (numMatch[1]) {
        day = parseInt(numMatch[1], 10);
      } else {
        continue;
      }
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime()) && d.getDate() === day) return d;
    }
  }

  // ISO or "2026-02-21"
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) {
    const d = new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export interface ParseResult {
  startIso: string;
  timezone: string;
}

/**
 * Parse natural language into ISO datetime.
 * Examples: "tomorrow at 3pm", "february 21 at 10am", "today 2:30pm"
 */
export function parseNaturalDateTime(
  text: string,
  baseDate: Date = new Date()
): ParseResult | null {
  if (!text || typeof text !== "string") return null;
  const t = String(text).trim();
  if (t.length < 2) return null;
  try {

  const atMatch = /(.+?)\s+at\s+(.+)|(.+?)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i.exec(t) ||
    /(.+?)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i.exec(t);
  let datePart: string;
  let timePart: string;
  if (atMatch) {
    datePart = (atMatch[1] || atMatch[3] || "").trim();
    timePart = (atMatch[2] || atMatch[4] || "").trim();
    if (!datePart || !timePart) {
      timePart = t;
      datePart = "today";
    }
  } else {
    const timeMatch = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i.exec(t);
    if (timeMatch) {
      timePart = timeMatch[1];
      datePart = t.replace(timeMatch[0], "").trim() || "today";
    } else {
      timePart = "9:00am";
      datePart = t;
    }
  }

  const date = parseDatePart(datePart, baseDate);
  const time = parseTimePart(timePart);
  if (!date || !time) return null;

  const combined = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
    0,
    0
  );
  if (combined.getTime() <= Date.now() || !Number.isFinite(combined.getTime())) return null;
  return {
    startIso: combined.toISOString(),
    timezone: DEFAULT_TZ,
  };
  } catch {
    return null;
  }
}
