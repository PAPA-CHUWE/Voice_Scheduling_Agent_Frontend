"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/formatDate";
import { apiEvents, apiSessions } from "@/lib/api/client";
import { DataTable, type Column } from "@/components/DataTable";
import type { Event } from "@/lib/api/types";
import type { Session } from "@/lib/api/types";

export default function EventsPage() {
  const [sessionFilter, setSessionFilter] = useState<string>("");

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

  const { data, isLoading } = useQuery({
    queryKey: ["events", sessionFilter || "all"],
    queryFn: () =>
      apiEvents.list({
        limit: 50,
        ...(sessionFilter ? { sessionId: sessionFilter } : {}),
      }),
  });

  // Backend returns { success, data: { events: [...], pagination } }
  const raw = data?.data;
  const rows = Array.isArray(raw)
    ? (raw as Event[])
    : Array.isArray((raw as unknown as { events?: Event[] })?.events)
      ? ((raw as unknown as { events: Event[] }).events)
      : [];

  const columns: Column<Event>[] = [
    {
      key: "title",
      header: "Title",
      render: (r) => r.title,
      link: (r) => `/events/${r._id}`,
    },
    { key: "attendee", header: "Attendee", render: (r) => r.attendeeName ?? "—" },
    {
      key: "start",
      header: "Start",
      render: (r) => (r.start ? formatDateTime(r.start) : "—"),
    },
    {
      key: "end",
      header: "End",
      render: (r) => (r.end ? formatDateTime(r.end) : "—"),
    },
    { key: "calendar", header: "Calendar", render: (r) => r.calendarId ?? "—" },
    {
      key: "notifications",
      header: "Notifications",
      render: (r) => {
        const ns = r.notificationStatus;
        if (!ns) return "—";
        const parts = [];
        if (ns.confirmationEmail) parts.push("Email: " + ns.confirmationEmail);
        if (ns.reminders) parts.push("Reminders: " + ns.reminders);
        return parts.length ? parts.join(" · ") : "—";
      },
    },
    {
      key: "link",
      header: "",
      render: () => "View",
      link: (r) => `/events/${r._id}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="session-filter" className="text-sm font-medium text-muted-foreground">
            Filter by session:
          </label>
          <select
            id="session-filter"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All events</option>
            {sessionsList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.meetingTitle || s.userName || "Session"} — {s.proposedStart ? formatDateTime(s.proposedStart) : s._id.slice(-6)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage={sessionFilter ? "No events for this session." : "No events yet."}
        isLoading={isLoading}
      />
    </div>
  );
}
