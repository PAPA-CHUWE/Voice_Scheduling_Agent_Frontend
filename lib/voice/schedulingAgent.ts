"use client";

import { RealtimeAgent, RealtimeSession, tool } from "@openai/agents/realtime";
import { z } from "zod";
import { apiSessions, apiEvents } from "@/lib/api/client";

const createCalendarEventParams = z.object({
  attendee_name: z.string().describe("Full name of the meeting attendee"),
  title: z.string().describe("Meeting title"),
  start_iso: z.string().describe("ISO 8601 datetime for meeting start, e.g. 2025-02-21T14:00:00.000Z"),
  duration_minutes: z.number().min(5).max(480).default(30).describe("Meeting duration in minutes"),
  timezone: z.string().default("Africa/Harare").describe("IANA timezone for the meeting"),
  attendee_email: z.string().email().optional().describe("Optional attendee email"),
  description: z.string().optional().describe("Optional meeting description"),
  reminders_enabled: z.boolean().default(true).describe("Whether to set calendar reminders"),
  reminder_offsets_minutes: z.array(z.number()).default([60, 10]).describe("Reminder offsets in minutes before start"),
});

/**
 * Tool: on confirm, create a session via create session endpoint, then create the event.
 * Runs in the browser; uses api client so JWT cookie is sent.
 */
const createCalendarEventTool = tool({
  name: "create_calendar_event",
  description:
    "Create a calendar event. Call this only after confirming with the user: attendee name, meeting title, date/time, and duration. Creates a session first, then the event.",
  parameters: createCalendarEventParams,
  async execute(input) {
    const durationMinutes = input.duration_minutes ?? 30;
    const timezone = input.timezone ?? "Africa/Harare";
    const remindersEnabled = input.reminders_enabled ?? true;
    const reminderOffsetsMinutes = input.reminder_offsets_minutes ?? [60, 10];

    try {
      // 1. Create session (voice channel)
      const sessionRes = await apiSessions.create({
        channel: "voice",
        userName: input.attendee_name,
        email: input.attendee_email || undefined,
        timezone,
        durationMinutes,
        meetingTitle: input.title,
        proposedStartIso: input.start_iso,
      });
      const sessionData = (sessionRes as { data?: { sessionId?: string; _id?: string } })?.data;
      const sessionId = sessionData?.sessionId ?? sessionData?._id;
      if (!sessionId) {
        return "Failed to create session: no session id in response.";
      }

      // 2. Create event linked to the session
      await apiEvents.create({
        sessionId,
        attendeeName: input.attendee_name,
        attendeeEmail: input.attendee_email || undefined,
        title: input.title,
        startIso: input.start_iso,
        durationMinutes,
        timezone,
        description: input.description,
        remindersEnabled,
        reminderOffsetsMinutes,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      return `Failed to create event: ${msg}`;
    }

    return `Successfully created the meeting "${input.title}". The attendee can check their calendar.`;
  },
});

const NAVIGATION_ROUTES: Record<string, string> = {
  dashboard: "/dashboard",
  home: "/dashboard",
  sessions: "/sessions",
  events: "/events",
  "webhook tester": "/webhook-tester",
};

const navigateTool = tool({
  name: "navigate",
  description: "Navigate the user to a page. Call when user says 'go to dashboard', 'open sessions', 'show events', 'take me to events', etc.",
  parameters: z.object({
    route: z.enum(["dashboard", "sessions", "events", "webhook-tester"]).describe("Target page"),
  }),
  async execute(input) {
    const path = NAVIGATION_ROUTES[input.route] ?? `/${input.route}`;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vsa-navigate", { detail: { path } }));
    }
    return `Navigating to ${input.route}.`;
  },
});

const SCHEDULING_INSTRUCTIONS = `You are a friendly voice assistant. You help with:
1. SCHEDULING: Schedule calendar meetings (name, date/time, title, confirm).
2. NAVIGRATION: Navigate pages. If user says "go to dashboard", "open sessions", "show events", call the navigate tool with the matching route.

CRITICAL - You MUST initiate the conversation: When the session starts or the user has not yet spoken, you MUST speak first. Say: "Hi! I'm your voice scheduling assistant. I'll help you schedule a meeting. What's your name?"

Follow these steps in order:
1. Ask for their name (if not yet provided).
2. Ask for the preferred date and time (e.g. "tomorrow at 3pm", "February 22 at 10:30am").
3. Ask for the meeting title (optional; default "Meeting" if they skip).
4. Confirm: name, title, date/time. Ask them to say "yes" to confirm or "no" to change.
5. When they confirm, call create_calendar_event with: attendee_name, title, start_iso (ISO 8601), duration_minutes (default 30), timezone (default Africa/Harare).

GUARDRAILS:
- For scheduling: stay on topic. If user asks unrelated questions, redirect to scheduling or navigation.
- Never skip the confirmation step before calling create_calendar_event.
- If they say "cancel" or "start over", begin again from step 1.
- Parse natural language dates/times into ISO 8601 for start_iso.
- For navigation: call navigate immediately when user says "go to dashboard", "open sessions", "show events", etc.`;

/**
 * Creates the scheduling RealtimeAgent with instructions and tools.
 */
export function createSchedulingAgent(): RealtimeAgent {
  return new RealtimeAgent({
    name: "Scheduling Assistant",
    instructions: SCHEDULING_INSTRUCTIONS,
    tools: [createCalendarEventTool, navigateTool],
  });
}

export type { RealtimeSession };
