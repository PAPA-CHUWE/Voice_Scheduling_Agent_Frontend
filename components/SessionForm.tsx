"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  sessionCreateFormSchema,
  type SessionCreateFormInput,
  type SessionCreateInput,
} from "@/lib/api/schemas";
import { localInZoneToISO, isoToLocalInZone } from "@/lib/dateTime";
import { TIMEZONE_OPTIONS, DURATION_OPTIONS } from "@/lib/constants";
import { useToast } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";

export function SessionForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: {
  defaultValues?: Partial<SessionCreateInput>;
  onSubmit: (data: SessionCreateInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}) {
  const { addToast } = useToast();
  const tz = defaultValues?.timezone ?? "Africa/Harare";
  let proposedDateDefault = "";
  let proposedTimeDefault = "09:00";
  if (defaultValues?.proposedStartIso) {
    try {
      const p = isoToLocalInZone(defaultValues.proposedStartIso, tz);
      proposedDateDefault = p.dateStr;
      proposedTimeDefault = p.timeStr;
    } catch {
      // keep defaults
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SessionCreateFormInput>({
    resolver: zodResolver(sessionCreateFormSchema),
    defaultValues: {
      channel: "web",
      timezone: "Africa/Harare",
      durationMinutes: 30,
      proposedStartDate: proposedDateDefault,
      proposedStartTime: proposedTimeDefault,
      ...defaultValues,
    },
  });

  async function handle(data: SessionCreateFormInput) {
    try {
      const proposedStartIso =
        data.proposedStartDate && data.proposedStartTime
          ? localInZoneToISO(data.proposedStartDate, data.proposedStartTime, data.timezone)
          : undefined;
      const payload: SessionCreateInput = {
        channel: data.channel,
        userName: data.userName,
        email: data.email || undefined,
        timezone: data.timezone,
        durationMinutes: data.durationMinutes,
        meetingTitle: data.meetingTitle || undefined,
        proposedStartIso: proposedStartIso ?? "",
      };
      await onSubmit(payload);
      addToast("Session created", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to create session", "error");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-5">
      <div>
        <label className={labelClass}>Channel</label>
        <select
          {...register("channel")}
          className={cn(inputClass, errors.channel && "border-destructive")}
        >
          <option value="web">Web</option>
          <option value="voice">Voice</option>
          <option value="api">API</option>
        </select>
        {errors.channel && (
          <p className="mt-1 text-sm text-destructive">{errors.channel.message}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>User name *</label>
        <input
          {...register("userName")}
          placeholder="e.g. Alice Moyo"
          className={cn(inputClass, errors.userName && "border-destructive")}
        />
        {errors.userName && (
          <p className="mt-1 text-sm text-destructive">{errors.userName.message}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          {...register("email")}
          placeholder="alice@example.com"
          className={cn(inputClass, errors.email && "border-destructive")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>Timezone</label>
        <select {...register("timezone")} className={inputClass}>
          {TIMEZONE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Duration</label>
        <select
          {...register("durationMinutes", { valueAsNumber: true })}
          className={cn(inputClass, errors.durationMinutes && "border-destructive")}
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.durationMinutes && (
          <p className="mt-1 text-sm text-destructive">{errors.durationMinutes.message}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>Meeting title</label>
        <input
          {...register("meetingTitle")}
          placeholder="e.g. Product Strategy Sync"
          className={inputClass}
        />
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-3 text-sm font-medium text-foreground">Proposed start (optional)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" {...register("proposedStartDate")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input type="time" {...register("proposedStartTime")} className={inputClass} />
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Converted to ISO using the timezone above.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Creating…" : "Create session"}
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
