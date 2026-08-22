/**
 * OWNER: Prajwal (Person D)
 * Sortable/filterable data table for manage views.
 */
import type { ReactNode } from "react";
import { Skeleton } from "./Skeleton.tsx";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  loading?: boolean;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No rows yet.",
  loading,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="df-card space-y-3 p-4" role="status" aria-label="Loading table">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="df-card border-dashed px-4 py-12 text-center text-sm text-[var(--color-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="df-card overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/80 text-[var(--color-muted)]">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-[var(--color-border)]/70 transition last:border-0 hover:bg-[var(--color-surface-2)]/50"
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 align-middle ${col.className ?? ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
