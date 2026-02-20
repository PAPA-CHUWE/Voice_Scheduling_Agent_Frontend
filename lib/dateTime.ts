/**
 * Convert local date/time in a given IANA timezone to ISO 8601 UTC string.
 * Uses Intl to get the zone offset at the given moment (handles DST).
 */
export function localInZoneToISO(
  dateStr: string,
  timeStr: string,
  ianaZone: string
): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh = 0, mm = 0] = timeStr.split(":").map(Number);
  const tempUtc = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const offsetMin = getTimezoneOffsetMinutes(ianaZone, tempUtc);
  const utcMs = tempUtc.getTime() - offsetMin * 60 * 1000;
  return new Date(utcMs).toISOString();
}

function getTimezoneOffsetMinutes(zone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: zone,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const match = tz.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!match) return 0;
  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const mins = parseInt(match[3] ?? "0", 10);
  return sign * (hours * 60 + mins);
}

/** Parse ISO string to YYYY-MM-DD and HH:mm in the given timezone for pre-filling inputs */
export function isoToLocalInZone(
  iso: string,
  ianaZone: string
): { dateStr: string; timeStr: string } {
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString("en-CA", { timeZone: ianaZone }); // YYYY-MM-DD
  const timeStr = d.toLocaleTimeString("en-GB", {
    timeZone: ianaZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { dateStr, timeStr };
}
