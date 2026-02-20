import { z } from "zod";

const isoDate = z
  .string()
  .datetime({ message: "Must be a valid ISO 8601 datetime" });

const futureIsoDate = isoDate.refine(
  (s: string) => new Date(s).getTime() > Date.now(),
  { message: "Date must be in the future" }
);

export const sessionCreateSchema = z.object({
  channel: z.enum(["web", "voice", "api"]).default("web"),
  userName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  timezone: z.string().default("Africa/Harare"),
  durationMinutes: z.coerce.number().min(5).max(480).default(30),
  meetingTitle: z.string().optional(),
  proposedStartIso: futureIsoDate.optional().or(z.literal("")),
});

/** Session form can use proposedStartDate + proposedStartTime; we build proposedStartIso in UI */
export const sessionCreateFormSchema = sessionCreateSchema.omit({ proposedStartIso: true }).extend({
  proposedStartDate: z.string().optional(),
  proposedStartTime: z.string().optional(),
});

export const eventCreateSchema = z.object({
  sessionId: z.string().optional(),
  attendeeName: z.string().min(2, "Attendee name required (min 2 chars)"),
  attendeeEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  title: z.string().min(1, "Title is required"),
  startIso: futureIsoDate,
  durationMinutes: z.coerce.number().min(5).max(480).default(30),
  timezone: z.string().default("Africa/Harare"),
  calendarId: z.string().optional(),
  description: z.string().max(2000).optional(),
  remindersEnabled: z.boolean().default(true),
  reminderOffsetsMinutes: z.array(z.number()).default([60, 10]),
});

/** Form uses startDate + startTime; component builds startIso before submit */
export const eventCreateFormSchema = eventCreateSchema
  .omit({ startIso: true })
  .extend({
    startDate: z.string().min(1, "Start date is required"),
    startTime: z.string().min(1, "Start time is required"),
    reminderOffsetsMinutes: z.union([
      z.array(z.number()),
      z.string().transform((s) => s.split(",").map((n) => parseInt(n.trim(), 10)).filter(Boolean)),
    ]).default([60, 10]),
  });

export const webhookToolFormSchema = z.object({
  toolName: z.string().default("create_calendar_event"),
  attendee_name: z.string().min(1, "Required"),
  attendee_email: z.string().email().optional().or(z.literal("")),
  title: z.string().min(1, "Required"),
  start_iso: isoDate,
  duration_minutes: z.coerce.number().min(5).max(480).default(30),
  timezone: z.string().default("Africa/Harare"),
  description: z.string().optional(),
  reminders_enabled: z.boolean().default(true),
  reminder_offsets_minutes: z
    .string()
    .optional()
    .transform((s: string | undefined) =>
      s ? s.split(",").map((n: string) => parseInt(n.trim(), 10)).filter(Boolean) : [60, 10]
    ),
});

export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;
export type SessionCreateFormInput = z.infer<typeof sessionCreateFormSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventCreateFormInput = z.infer<typeof eventCreateFormSchema>;
export type WebhookToolFormInput = z.infer<typeof webhookToolFormSchema>;
