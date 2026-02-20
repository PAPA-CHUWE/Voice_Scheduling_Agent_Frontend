"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import { webhookToolFormSchema, type WebhookToolFormInput } from "@/lib/api/schemas";
import { apiWebhook } from "@/lib/api/client";
import { useToast } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";

export function WebhookToolForm() {
  const { addToast } = useToast();
  const [response, setResponse] = useState<unknown>(null);
  const [curl, setCurl] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<WebhookToolFormInput>({
    resolver: zodResolver(webhookToolFormSchema),
    defaultValues: {
      toolName: "create_calendar_event",
      timezone: "Africa/Harare",
      duration_minutes: 30,
      reminders_enabled: true,
      reminder_offsets_minutes: [60, 10],
    },
  });

  const formValues = watch();

  function buildPayload(): Record<string, unknown> {
    const args: Record<string, unknown> = {
      attendee_name: formValues.attendee_name,
      title: formValues.title,
      start_iso: formValues.start_iso,
      duration_minutes: formValues.duration_minutes,
      timezone: formValues.timezone,
      reminders_enabled: formValues.reminders_enabled,
      reminder_offsets_minutes: Array.isArray(formValues.reminder_offsets_minutes)
        ? formValues.reminder_offsets_minutes
        : [60, 10],
    };
    if (formValues.attendee_email) args.attendee_email = formValues.attendee_email;
    if (formValues.description) args.description = formValues.description;
    return {
      type: "tool_call",
      toolName: formValues.toolName,
      arguments: args,
    };
  }

  async function handle(data: WebhookToolFormInput) {
    setResponse(null);
    const payload = {
      type: "tool_call",
      toolName: data.toolName,
      arguments: {
        attendee_name: data.attendee_name,
        attendee_email: data.attendee_email || undefined,
        title: data.title,
        start_iso: data.start_iso,
        duration_minutes: data.duration_minutes,
        timezone: data.timezone,
        description: data.description || undefined,
        reminders_enabled: data.reminders_enabled,
        reminder_offsets_minutes: data.reminder_offsets_minutes,
      },
    };
    setCurl(
      `curl -X POST '${typeof window !== "undefined" ? window.location.origin : ""}/api/proxy/webhooks/voice' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(payload)}'`
    );
    try {
      const res = await apiWebhook.voice(payload);
      setResponse(res);
      addToast("Webhook responded", "success");
    } catch (e) {
      setResponse({ error: e instanceof Error ? e.message : "Request failed" });
      addToast(e instanceof Error ? e.message : "Request failed", "error");
    }
  }

  function copyCurl() {
    const payload = buildPayload();
    const curlStr = `curl -X POST '${typeof window !== "undefined" ? window.location.origin : ""}/api/proxy/webhooks/voice' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(payload)}'`;
    navigator.clipboard.writeText(curlStr);
    addToast("cURL copied to clipboard", "success");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handle)} className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Tool name</label>
          <input
            {...register("toolName")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">attendee_name *</label>
          <input
            {...register("attendee_name")}
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              errors.attendee_name && "border-destructive"
            )}
          />
          {errors.attendee_name && (
            <p className="mt-1 text-sm text-destructive">{errors.attendee_name.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">attendee_email</label>
          <input
            type="email"
            {...register("attendee_email")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">title *</label>
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
          <label className="mb-1 block text-sm font-medium">start_iso *</label>
          <input
            {...register("start_iso")}
            placeholder="2027-02-20T10:00:00.000Z"
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              errors.start_iso && "border-destructive"
            )}
          />
          {errors.start_iso && (
            <p className="mt-1 text-sm text-destructive">{errors.start_iso.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">duration_minutes</label>
          <input
            type="number"
            {...register("duration_minutes")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">timezone</label>
          <input
            {...register("timezone")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">description</label>
          <input
            {...register("description")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register("reminders_enabled")}
            className="h-4 w-4 rounded border-input"
          />
          <label className="text-sm font-medium">reminders_enabled</label>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">reminder_offsets_minutes (comma-separated)</label>
          <input
            {...register("reminder_offsets_minutes")}
            placeholder="60, 10"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Send to webhook
          </button>
          <button
            type="button"
            onClick={copyCurl}
            className="flex items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Copy className="h-4 w-4" />
            Copy curl
          </button>
        </div>
      </form>
      {response !== null && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="mb-2 font-medium">Response</h3>
          <pre className="overflow-auto rounded bg-muted p-3 text-xs">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
      {curl && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="mb-2 font-medium">Last request (curl)</h3>
          <pre className="overflow-auto rounded bg-muted p-3 text-xs">{curl}</pre>
          <button
            type="button"
            onClick={copyCurl}
            className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Copy className="h-4 w-4" />
            Copy curl
          </button>
        </div>
      )}
    </div>
  );
}
