"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDateTime, formatDateOnly } from "@/lib/formatDate";
import { apiSessions } from "@/lib/api/client";
import { DataTable, type Column } from "@/components/DataTable";
import type { Session } from "@/lib/api/types";

export default function SessionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => apiSessions.list({ limit: 50 }),
  });

  const raw = data?.data ?? data;
  const rows = Array.isArray(raw) ? (raw as Session[]) : [];

  const columns: Column<Session>[] = [
    { key: "status", header: "Status", render: (r) => r.status },
    { key: "userName", header: "User", render: (r) => r.userName ?? "—" },
    { key: "email", header: "Email", render: (r) => r.email ?? "—" },
    {
      key: "proposedStart",
      header: "Proposed start",
      render: (r) =>
        r.proposedStart ? formatDateTime(r.proposedStart) : "—",
    },
    { key: "duration", header: "Duration", render: (r) => `${r.durationMinutes ?? "—"} min` },
    {
      key: "created",
      header: "Created",
      render: (r) => (r.createdAt ? formatDateOnly(r.createdAt) : "—"),
    },
    {
      key: "link",
      header: "",
      render: () => "View",
      link: (r) => `/sessions/${r._id}`,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Sessions</h1>
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage="No sessions yet."
        isLoading={isLoading}
      />
    </div>
  );
}
