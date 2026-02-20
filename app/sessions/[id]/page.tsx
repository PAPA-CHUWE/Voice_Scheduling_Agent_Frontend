"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateTime } from "@/lib/formatDate";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { apiSessions, apiEvents } from "@/lib/api/client";
import { EventForm } from "@/components/EventForm";
import { useToast } from "@/lib/ui/toast";
import type { Session as SessionType } from "@/lib/api/types";
import type { EventCreateInput } from "@/lib/api/schemas";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [eventModal, setEventModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["session", id],
    queryFn: () => apiSessions.get(id),
  });

  const eventCreate = useMutation({
    mutationFn: (body: EventCreateInput) =>
      apiEvents.create({ ...body, sessionId: id } as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEventModal(false);
    },
  });

  const deleteSession = useMutation({
    mutationFn: () => apiSessions.delete(id),
    onSuccess: () => {
      addToast("Session deleted", "success");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      router.push("/sessions");
    },
    onError: (e) => {
      addToast(e instanceof Error ? e.message : "Failed to delete session", "error");
    },
  });

  const raw = data?.data ?? data;
  const session = raw as SessionType | undefined;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
      </div>
    );
  }
  if (error || !session) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Session not found or error loading.
        <Link href="/sessions" className="ml-2 underline">
          Back to sessions
        </Link>
      </div>
    );
  }

  const defaultEventValues: Partial<EventCreateInput> = {
    attendeeName: session.userName ?? undefined,
    attendeeEmail: session.email ?? undefined,
    title: session.meetingTitle ?? "Meeting",
    timezone: session.timezone ?? "Africa/Harare",
    durationMinutes: session.durationMinutes ?? 30,
    startIso: session.proposedStart
      ? new Date(session.proposedStart).toISOString()
      : undefined,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/sessions"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Sessions
        </Link>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <h1 className="mb-4 text-xl font-semibold">Session details</h1>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <dt className="text-muted-foreground">ID</dt>
          <dd className="font-mono text-xs">{session._id}</dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd>{session.status}</dd>
          <dt className="text-muted-foreground">Channel</dt>
          <dd>{session.channel}</dd>
          <dt className="text-muted-foreground">User name</dt>
          <dd>{session.userName ?? "—"}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{session.email ?? "—"}</dd>
          <dt className="text-muted-foreground">Meeting title</dt>
          <dd>{session.meetingTitle ?? "—"}</dd>
          <dt className="text-muted-foreground">Timezone</dt>
          <dd>{session.timezone ?? "—"}</dd>
          <dt className="text-muted-foreground">Proposed start</dt>
          <dd>
            {session.proposedStart
              ? formatDateTime(session.proposedStart)
              : "—"}
          </dd>
          <dt className="text-muted-foreground">Duration (min)</dt>
          <dd>{session.durationMinutes ?? "—"}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd>
            {session.createdAt
              ? formatDateTime(session.createdAt)
              : "—"}
          </dd>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEventModal(true)}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create event from session
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Delete this session? This cannot be undone.")) {
                deleteSession.mutate();
              }
            }}
            disabled={deleteSession.isPending}
            className="flex items-center gap-1 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete session
          </button>
        </div>
      </div>

      {eventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-lg border border-border bg-card p-4">
            <h2 className="mb-4 font-semibold">Create event</h2>
            <EventForm
              defaultValues={defaultEventValues}
              onSubmit={async (data) => {
                const result = await eventCreate.mutateAsync(data);
                const eventId = (result as { data?: { eventId?: string } })?.data?.eventId;
                if (eventId) {
                  router.push(`/events/${eventId}`);
                } else {
                  router.push("/events");
                }
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
