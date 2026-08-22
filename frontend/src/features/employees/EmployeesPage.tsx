/**
 * OWNER: Nidhish (Person B)
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { employeesApi } from "../../api/employees.ts";
import { EmployeeCard } from "./EmployeeCard.tsx";
import { CreateEmployeeModal } from "./CreateEmployeeModal.tsx";
import { CheckInWidget } from "./CheckInWidget.tsx";
import { useAuth } from "../auth/AuthContext.tsx";
import { PaginationControls } from "../../components/PaginationControls.tsx";
import { LoadingState } from "../../components/LoadingState.tsx";
import { EmptyState } from "../../components/EmptyState.tsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.ts";

const PAGE_SIZE = 12;

export function EmployeesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const canManage = user?.role === "ADMIN" || user?.role === "HR";

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["employees", user?.companyId, debouncedSearch, page],
    queryFn: async () => {
      const res = await employeesApi.list({
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      });
      return res.data.data as {
        items: Array<Record<string, unknown>>;
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
    enabled: canManage && !!user?.companyId,
    placeholderData: (prev) => prev,
  });

  if (!canManage) {
    return <Navigate to="/me" replace />;
  }

  const rows = data?.items ?? [];
  const total = data?.pagination.total ?? 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Employees</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Directory — green present, purple on leave, yellow absent.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          />
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
          >
            + New
          </button>
        </div>
      </div>
      {isLoading ? <LoadingState label="Loading employees…" /> : null}
      {error ? <p className="text-[var(--color-danger)]">Failed to load employees.</p> : null}
      {!isLoading && !error && rows.length === 0 ? (
        <EmptyState
          title="No employees yet"
          description="Add your first teammate to start attendance, leave, and payroll."
          actionLabel="+ New"
          onAction={() => setCreateOpen(true)}
        />
      ) : null}
      <div
        className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${isFetching && !isLoading ? "opacity-70" : ""}`}
      >
        {rows.map((emp) => {
          const id = String(emp.id ?? "");
          const name = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || "Employee";
          return (
            <EmployeeCard
              key={id}
              name={name}
              position={emp.jobPosition as string | null}
              avatarUrl={emp.avatarUrl as string | null}
              presence={
                (emp.presenceStatus as "present" | "on_leave" | "absent") ??
                (emp.presence as "present" | "on_leave" | "absent") ??
                "unknown"
              }
              onClick={() => navigate(`/employees/${id}`)}
            />
          );
        })}
      </div>
      <PaginationControls page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />

      <CheckInWidget />

      <CreateEmployeeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          void qc.invalidateQueries({ queryKey: ["employees"] });
        }}
        onOpenProfile={(employeeId) => navigate(`/employees/${employeeId}`)}
      />
    </section>
  );
}
