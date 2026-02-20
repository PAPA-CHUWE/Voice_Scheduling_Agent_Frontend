"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventCreateSchema, type EventCreateInput } from "@/lib/api/schemas";
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventCreateInput>({
    resolver: zodResolver(eventCreateSchema),
    defaultValues: {
      timezone: "Africa/Harare",
      durationMinutes: 30,
      remindersEnabled: true,
      reminderOffsetsMinutes: [60, 10],
      ...defaultValues,
    },
  });

  async function handle(data: EventCreateInput) {
    try {
      await onSubmit(data);
      addToast("Event created", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to create event", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Session ID</label>
        <input
          {...register("sessionId")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Attendee name *</label>
        <input
          {...register("attendeeName")}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            errors.attendeeName && "border-destructive"
          )}
        />
        {errors.attendeeName && (
          <p className="mt-1 text-sm text-destructive">{errors.attendeeName.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Attendee email</label>
        <input
          type="email"
          {...register("attendeeEmail")}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            errors.attendeeEmail && "border-destructive"
          )}
        />
        {errors.attendeeEmail && (
          <p className="mt-1 text-sm text-destructive">{errors.attendeeEmail.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Title *</label>
        <input
          {...register("title")}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            errors.title && "border-destructive"
          )}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Start (ISO) *</label>
        <input
          {...register("startIso")}
          placeholder="2027-02-20T10:00:00.000Z"
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            errors.startIso && "border-destructive"
          )}
        />
        {errors.startIso && (
          <p className="mt-1 text-sm text-destructive">{errors.startIso.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Duration (minutes)</label>
        <input
          type="number"
          {...register("durationMinutes")}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            errors.durationMinutes && "border-destructive"
          )}
        />
        {errors.durationMinutes && (
          <p className="mt-1 text-sm text-destructive">{errors.durationMinutes.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Timezone</label>
        <input
          {...register("timezone")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Calendar ID</label>
        <input
          {...register("calendarId")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          {...register("description")}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register("remindersEnabled")}
          className="h-4 w-4 rounded border-input"
        />
        <label className="text-sm font-medium">Reminders enabled</label>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Reminder offsets (minutes, comma-separated)</label>
        <input
          {...register("reminderOffsetsMinutes", {
            setValueAs: (v: string | number[]) =>
              typeof v === "string"
                ? v.split(",").map((n) => parseInt(n.trim(), 10)).filter(Boolean)
                : v,
          })}
          placeholder="60, 10"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Creating…" : "Create event"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
