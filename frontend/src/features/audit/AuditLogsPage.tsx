/**
 * OWNER: Prasanna (Person A) — audit log viewer UI.
 */
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, getApiError } from "../../api/client.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { PaginationControls } from "../../components/PaginationControls.tsx";
import { LoadingState } from "../../components/LoadingState.tsx";

const PAGE_SIZE = 20;

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: { loginId: string; email: string; role: string };
};

export function AuditLogsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ["audit-logs", page],
    enabled: user?.role === "ADMIN",
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { items: AuditItem[]; page: number; limit: number; total: number };
      }>("/audit-logs", { params: { page, limit: PAGE_SIZE } });
      return res.data.data;
    },
  });

  if (user?.role !== "ADMIN") {
    return <Navigate to="/employees" replace />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Audit log</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Sensitive actions recorded for your company (Admin only).
        </p>
      </div>

      {q.isLoading ? <LoadingState label="Loading audit log…" /> : null}
      {q.error ? <p className="text-[var(--color-danger)]">{getApiError(q.error).message}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Entity</th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.items ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[var(--color-muted)]">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              (q.data?.items ?? []).map((row) => (
                <tr key={row.id} className="border-t border-[var(--color-border)]">
                  <td className="px-3 py-2 tabular-nums">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    {row.actor?.loginId ?? "—"}
                    <span className="block text-xs text-[var(--color-muted)]">{row.actor?.role}</span>
                  </td>
                  <td className="px-3 py-2 font-medium">{row.action}</td>
                  <td className="px-3 py-2 text-[var(--color-muted)]">
                    {row.entityType} · {row.entityId.slice(0, 8)}…
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        page={page}
        limit={PAGE_SIZE}
        total={q.data?.total ?? 0}
        onPageChange={setPage}
      />
    </section>
  );
}
