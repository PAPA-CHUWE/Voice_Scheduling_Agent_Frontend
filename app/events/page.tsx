"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiEvents } from "@/lib/api/client";
import { DataTable, type Column } from "@/components/DataTable";
import type { Event } from "@/lib/api/types";

export default function EventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiEvents.list({ limit: 50 }),
  });

  const raw = data?.data ?? data;
  const rows = Array.isArray(raw) ? (raw as Event[]) : [];

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
      render: (r) => (r.start ? format(new Date(r.start), "PPp") : "—"),
    },
    {
      key: "end",
      header: "End",
      render: (r) => (r.end ? format(new Date(r.end), "PPp") : "—"),
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
      <h1 className="text-2xl font-semibold">Events</h1>
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage="No events yet."
        isLoading={isLoading}
      />
    </div>
  );
}
