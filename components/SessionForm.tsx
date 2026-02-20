"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sessionCreateSchema, type SessionCreateInput } from "@/lib/api/schemas";
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SessionCreateInput>({
    resolver: zodResolver(sessionCreateSchema),
    defaultValues: {
      channel: "web",
      timezone: "Africa/Harare",
      durationMinutes: 30,
      ...defaultValues,
    },
  });

  async function handle(data: SessionCreateInput) {
    try {
      await onSubmit(data);
      addToast("Session created", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to create session", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Channel</label>
        <select
          {...register("channel")}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            errors.channel && "border-destructive"
          )}
        >
          <option value="web">web</option>
          <option value="voice">voice</option>
          <option value="api">api</option>
        </select>
        {errors.channel && (
          <p className="mt-1 text-sm text-destructive">{errors.channel.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">User name *</label>
        <input
          {...register("userName")}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            errors.userName && "border-destructive"
          )}
        />
        {errors.userName && (
          <p className="mt-1 text-sm text-destructive">{errors.userName.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          {...register("email")}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            errors.email && "border-destructive"
          )}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Timezone</label>
        <input
          {...register("timezone")}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            errors.timezone && "border-destructive"
          )}
        />
        {errors.timezone && (
          <p className="mt-1 text-sm text-destructive">{errors.timezone.message}</p>
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
        <label className="mb-1 block text-sm font-medium">Meeting title</label>
        <input
          {...register("meetingTitle")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Proposed start (ISO)</label>
        <input
          {...register("proposedStartIso")}
          placeholder="2027-02-20T10:00:00.000Z"
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            errors.proposedStartIso && "border-destructive"
          )}
        />
        {errors.proposedStartIso && (
          <p className="mt-1 text-sm text-destructive">{errors.proposedStartIso.message}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Creating…" : "Create session"}
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
