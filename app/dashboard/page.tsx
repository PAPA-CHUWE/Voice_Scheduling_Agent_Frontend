"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Calendar, CalendarDays } from "lucide-react";
import { apiSessions, apiEvents } from "@/lib/api/client";
import { StatCard } from "@/components/StatCard";
import { DataTable, type Column } from "@/components/DataTable";
import { SessionForm } from "@/components/SessionForm";
import { EventForm } from "@/components/EventForm";
import type { Session } from "@/lib/api/types";
import type { Event } from "@/lib/api/types";
import type { SessionCreateInput } from "@/lib/api/schemas";
import type { EventCreateInput } from "@/lib/api/schemas";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [sessionModal, setSessionModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => apiSessions.list({ limit: 100 }),
  });
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiEvents.list({ limit: 100 }),
  });

  const sessionCreate = useMutation({
    mutationFn: (body: SessionCreateInput) =>
      apiSessions.create(body as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setSessionModal(false);
    },
  });
  const eventCreate = useMutation({
    mutationFn: (body: EventCreateInput) =>
      apiEvents.create(body as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEventModal(false);
    },
  });

  const sessions = (sessionsData?.data ?? sessionsData) as Session[] | undefined;
  const events = (eventsData?.data ?? eventsData) as Event[] | undefined;
  const sessionList = Array.isArray(sessions) ? sessions : [];
  const eventList = Array.isArray(events) ? events : [];
  const recentEvents = eventList.slice(0, 5);

  const eventColumns: Column<Event>[] = [
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSessionModal(true)}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create session
          </button>
          <button
            type="button"
            onClick={() => setEventModal(true)}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            Create event
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Total sessions"
          value={sessionsLoading ? "…" : sessionList.length}
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          title="Total events"
          value={eventsLoading ? "…" : eventList.length}
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Recent events</h2>
        <DataTable
          columns={eventColumns}
          rows={recentEvents}
          emptyMessage="No events yet. Create one from Events or here."
          isLoading={eventsLoading}
        />
        {eventList.length > 0 && (
          <Link
            href="/events"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            View all events
          </Link>
        )}
      </div>

      {sessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-lg border border-border bg-card p-4">
            <h2 className="mb-4 font-semibold">Quick create session</h2>
            <SessionForm
              onSubmit={async (data) => {
                await sessionCreate.mutateAsync(data);
              }}
              onCancel={() => setSessionModal(false)}
              isLoading={sessionCreate.isPending}
            />
          </div>
        </div>
      )}
      {eventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-lg border border-border bg-card p-4">
            <h2 className="mb-4 font-semibold">Quick create event</h2>
            <EventForm
              onSubmit={async (data) => {
                await eventCreate.mutateAsync(data);
              }}
              onCancel={() => setEventModal(false)}
              isLoading={eventCreate.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
