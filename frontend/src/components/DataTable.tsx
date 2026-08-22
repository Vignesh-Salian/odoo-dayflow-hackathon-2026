/**
 * OWNER: Prajwal (Person D)
 * Sortable/filterable data table for manage views.
 */
import type { ReactNode } from "react";

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
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-10 text-center text-sm text-[var(--color-muted)]">
        Loading…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 py-10 text-center text-sm text-[var(--color-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)]">
            {columns.map((col) => (
              <th key={col.key} className={`px-3 py-2.5 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-[var(--color-border)]/70 last:border-0 hover:bg-[var(--color-surface-2)]/50"
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-3 py-2.5 align-middle ${col.className ?? ""}`}>
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
