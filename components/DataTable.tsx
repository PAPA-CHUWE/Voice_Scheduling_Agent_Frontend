"use client";

import Link from "next/link";
import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  link?: (row: T) => string;
}

export function DataTable<T extends { _id?: string }>({
  columns,
  rows,
  keyField = "_id",
  emptyMessage = "No data",
  isLoading,
}: {
  columns: Column<T>[];
  rows: T[];
  keyField?: keyof T | "_id";
  emptyMessage?: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="animate-pulse space-y-3 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const key = (keyField === "_id" ? row._id : row[keyField as keyof T]) as string;
            return (
              <tr
                key={key ?? i}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                {columns.map((col) => {
                  const cell = col.render(row);
                  const href = col.link?.(row);
                  return (
                    <td key={col.key} className="px-4 py-3">
                      {href ? (
                        <Link
                          href={href}
                          className="font-medium text-primary hover:underline"
                        >
                          {cell}
                        </Link>
                      ) : (
                        cell
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
