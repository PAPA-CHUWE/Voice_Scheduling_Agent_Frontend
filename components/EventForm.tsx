"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  eventCreateFormSchema,
  type EventCreateFormInput,
  type EventCreateInput,
} from "@/lib/api/schemas";
import { localInZoneToISO, isoToLocalInZone } from "@/lib/dateTime";
import {
  TIMEZONE_OPTIONS,
  CALENDAR_OPTIONS,
  DURATION_OPTIONS,
  REMINDER_OFFSET_OPTIONS,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/formatDate";
import { apiSessions } from "@/lib/api/client";
import type { Session } from "@/lib/api/types";
import { useToast } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";

export function EventForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: {
  defaultValues?: Partial<EventCreateInput>;
  onSubmit: (data: EventCreateInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}) {
  const { addToast } = useToast();
  const timezone = defaultValues?.timezone ?? "Africa/Harare";
  let startDateDefault = "";
  let startTimeDefault = "09:00";
  if (defaultValues?.startIso) {
    try {
      const parsed = isoToLocalInZone(defaultValues.startIso, timezone);
      startDateDefault = parsed.dateStr;
      startTimeDefault = parsed.timeStr;
    } catch {
      // keep defaults
    }
  }

  const queryClient = useQueryClient();
  const { data: sessionsResponse } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => apiSessions.list({ limit: 100 }),
  });
  const sessionsPayload = sessionsResponse?.data as { sessions?: Session[] } | Session[] | undefined;
  const sessionsList: Session[] = Array.isArray(sessionsPayload)
    ? sessionsPayload
    : Array.isArray(sessionsPayload?.sessions)
      ? sessionsPayload.sessions
      : [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EventCreateFormInput>({
    resolver: zodResolver(eventCreateFormSchema),
    defaultValues: {
      timezone: "Africa/Harare",
      durationMinutes: 30,
      remindersEnabled: true,
      reminderOffsetsMinutes: [60, 10],
      calendarId: "primary",
      ...defaultValues,
      startDate: (defaultValues as EventCreateFormInput & { startDate?: string })?.startDate ?? startDateDefault,
      startTime: (defaultValues as EventCreateFormInput & { startTime?: string })?.startTime ?? startTimeDefault,
    },
  });

  async function handle(data: EventCreateFormInput) {
    try {
      const startIso = localInZoneToISO(
        data.startDate,
        data.startTime,
        data.timezone
      );
      const now = new Date().getTime();
      const inFuture = new Date(startIso).getTime() > now;
      if (!inFuture) {
        addToast("Start date & time must be in the future", "error");
        return;
      }
      const rawOffsets = data.reminderOffsetsMinutes;
      const offsets: number[] = Array.isArray(rawOffsets)
        ? rawOffsets
        : typeof rawOffsets === "string"
          ? (rawOffsets as string).split(",").map((n: string) => parseInt(n.trim(), 10)).filter(Boolean)
          : [60, 10];

      let sessionId = data.sessionId?.trim() || undefined;

      if (!sessionId) {
        const sessionRes = await apiSessions.create({
          channel: "web",
          userName: data.attendeeName,
          email: data.attendeeEmail || undefined,
          meetingTitle: data.title,
          timezone: data.timezone,
          durationMinutes: data.durationMinutes,
          proposedStartIso: startIso,
        });
        const created = (sessionRes as { data?: { _id?: string; sessionId?: string } })?.data;
        sessionId = created?._id ?? created?.sessionId ?? undefined;
        if (!sessionId) {
          addToast("Created session but could not get session ID", "error");
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["sessions"] });
      }

      const payload: EventCreateInput = {
        sessionId,
        attendeeName: data.attendeeName,
        attendeeEmail: data.attendeeEmail || undefined,
        title: data.title,
        startIso,
        durationMinutes: data.durationMinutes,
        timezone: data.timezone,
        calendarId: data.calendarId || undefined,
        description: data.description || undefined,
        remindersEnabled: data.remindersEnabled,
        reminderOffsetsMinutes: offsets.length ? offsets : [60, 10],
      };
      await onSubmit(payload);
      addToast("Event created", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to create event", "error");
    }
  }

  const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Attendee name *</label>
          <input
            {...register("attendeeName")}
            placeholder="e.g. Alice Moyo"
            className={cn(inputClass, errors.attendeeName && "border-destructive")}
          />
          {errors.attendeeName && (
            <p className="mt-1 text-sm text-destructive">{errors.attendeeName.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Attendee email</label>
          <input
            type="email"
            {...register("attendeeEmail")}
            placeholder="alice@example.com"
            className={cn(inputClass, errors.attendeeEmail && "border-destructive")}
          />
          {errors.attendeeEmail && (
            <p className="mt-1 text-sm text-destructive">{errors.attendeeEmail.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className={labelClass}>Title *</label>
        <input
          {...register("title")}
          placeholder="e.g. Product Strategy Sync"
          className={cn(inputClass, errors.title && "border-destructive")}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-3 text-sm font-medium text-foreground">When</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Start date *</label>
            <input
              type="date"
              {...register("startDate")}
              className={cn(inputClass, errors.startDate && "border-destructive")}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-destructive">{errors.startDate.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Start time *</label>
            <input
              type="time"
              {...register("startTime")}
              className={cn(inputClass, errors.startTime && "border-destructive")}
            />
            {errors.startTime && (
              <p className="mt-1 text-sm text-destructive">{errors.startTime.message}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Timezone</label>
            <select {...register("timezone")} className={inputClass}>
              {TIMEZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Date & time above are in this timezone; the system converts to ISO for the API.
            </p>
          </div>
          <div>
            <label className={labelClass}>Duration</label>
            <select {...register("durationMinutes", { valueAsNumber: true })} className={inputClass}>
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Calendar</label>
          <select {...register("calendarId")} className={inputClass}>
            {CALENDAR_OPTIONS.map((opt) => (
              <option key={opt.value || "default"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              {...register("remindersEnabled")}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm font-medium">Send reminders</span>
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>Remind before</label>
        <select {...register("reminderOffsetsMinutes")} className={inputClass}>
          {REMINDER_OFFSET_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value.join(",")}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Link to session (optional)</label>
        <select
          {...register("sessionId", {
            onChange: (e) => {
              const id = e.target.value;
              const session = sessionsList.find((s) => s._id === id);
              if (session) {
                setValue("title", session.meetingTitle ?? "");
                setValue("attendeeName", session.userName ?? "");
                setValue("attendeeEmail", session.email ?? "");
                setValue("timezone", session.timezone ?? "Africa/Harare");
                setValue("durationMinutes", session.durationMinutes ?? 30);
                if (session.proposedStart) {
                  try {
                    const { dateStr, timeStr } = isoToLocalInZone(
                      session.proposedStart,
                      session.timezone ?? "Africa/Harare"
                    );
                    setValue("startDate", dateStr);
                    setValue("startTime", timeStr);
                  } catch {
                    // keep current date/time
                  }
                }
              }
            },
          })}
          className={inputClass}
        >
          <option value="">No session — create standalone event</option>
          {sessionsList.map((s) => (
            <option key={s._id} value={s._id}>
              {s.meetingTitle || s.userName || "Session"} — {s.proposedStart ? formatDateTime(s.proposedStart) : "No time"}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          Select a session to link this event and prefill details.
        </p>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="e.g. Quarterly roadmap planning and KPI alignment."
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Creating…" : "Create event"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
