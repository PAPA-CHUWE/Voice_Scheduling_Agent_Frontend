"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDateTime } from "@/lib/formatDate";
import { ArrowLeft, ExternalLink, Copy } from "lucide-react";
import { apiEvents } from "@/lib/api/client";
import type { Event } from "@/lib/api/types";
import { useToast } from "@/lib/ui/toast";

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { addToast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["event", id],
    queryFn: () => apiEvents.get(id),
  });

  const raw = data?.data ?? data;
  const event = raw as Event | undefined;

  function copyCurl() {
    if (!event) return;
    const payload = {
      type: "tool_call",
      toolName: "create_calendar_event",
      arguments: {
        attendee_name: event.attendeeName,
        attendee_email: event.description,
        title: event.title,
        start_iso: event.start,
        duration_minutes: 30,
        timezone: event.timezone ?? "Africa/Harare",
      },
    };
    const curl = `curl -X POST '${typeof window !== "undefined" ? window.location.origin : ""}/api/proxy/webhooks/voice' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(payload)}'`;
    navigator.clipboard.writeText(curl);
    addToast("cURL copied to clipboard", "success");
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>
    );
  }
  if (error || !event) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Event not found or error loading.
        <Link href="/events" className="ml-2 underline">
          Back to events
        </Link>
      </div>
    );
  }

  const ns = event.notificationStatus;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/events"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Events
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyCurl}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-muted"
          >
            <Copy className="h-4 w-4" />
            Copy curl
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h1 className="mb-4 text-xl font-semibold">{event.title}</h1>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <dt className="text-muted-foreground">ID</dt>
          <dd className="font-mono text-xs">{event._id}</dd>
          <dt className="text-muted-foreground">Attendee</dt>
          <dd>{event.attendeeName ?? "—"}</dd>
          <dt className="text-muted-foreground">Start</dt>
          <dd>
            {event.start
              ? formatDateTime(event.start) + (event.timezone ? ` (${event.timezone})` : "")
              : "—"}
          </dd>
          <dt className="text-muted-foreground">End</dt>
          <dd>{event.end ? formatDateTime(event.end) : "—"}</dd>
          <dt className="text-muted-foreground">Google Event ID</dt>
          <dd className="font-mono text-xs">{event.googleEventId ?? "—"}</dd>
          <dt className="text-muted-foreground">Calendar ID</dt>
          <dd>{event.calendarId ?? "—"}</dd>
          <dt className="text-muted-foreground">Confirmation email</dt>
          <dd>{ns?.confirmationEmail ?? "—"}</dd>
          <dt className="text-muted-foreground">Reminders</dt>
          <dd>{ns?.reminders ?? "—"}</dd>
          {event.description && (
            <>
              <dt className="text-muted-foreground">Description</dt>
              <dd className="col-span-2">{event.description}</dd>
            </>
          )}
        </dl>
        {event.htmlLink && (
          <div className="mt-4">
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Google Calendar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
