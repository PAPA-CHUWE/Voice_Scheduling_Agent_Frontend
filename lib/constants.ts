/** Common timezones for dropdowns (label, IANA value) */
export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "Africa/Harare", label: "Harare (CAT, UTC+2)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST, UTC+2)" },
  { value: "Africa/Lagos", label: "Lagos (WAT, UTC+1)" },
  { value: "Africa/Nairobi", label: "Nairobi (EAT, UTC+3)" },
  { value: "Africa/Cairo", label: "Cairo (EET, UTC+2)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET, UTC+1)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "America/Chicago", label: "Chicago (CT)" },
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)" },
  { value: "Asia/Kolkata", label: "India (IST, UTC+5:30)" },
  { value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

/** Calendar ID options for Google Calendar */
export const CALENDAR_OPTIONS: { value: string; label: string }[] = [
  { value: "primary", label: "Primary calendar" },
  { value: "", label: "Default (let backend choose)" },
];

/** Duration presets (minutes) */
export const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

/** Reminder presets */
export const REMINDER_OFFSET_OPTIONS: { value: number[]; label: string }[] = [
  { value: [60, 10], label: "1 hour & 10 min before" },
  { value: [30, 5], label: "30 min & 5 min before" },
  { value: [1440, 60], label: "1 day & 1 hour before" },
  { value: [15], label: "15 min before" },
];
