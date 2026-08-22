/**
 * OWNER: Nidhish (Person B)
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { employeesApi } from "../../api/employees.ts";
import { EmployeeCard } from "./EmployeeCard.tsx";
import { CreateEmployeeModal } from "./CreateEmployeeModal.tsx";
import { CheckInWidget } from "./CheckInWidget.tsx";
import { OrgChart, type OrgPerson } from "./OrgChart.tsx";
import { useAuth } from "../auth/AuthContext.tsx";
import { PaginationControls } from "../../components/PaginationControls.tsx";
import { EmptyState } from "../../components/EmptyState.tsx";
import { SkeletonCards } from "../../components/Skeleton.tsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.ts";

const PAGE_SIZE = 12;

export function EmployeesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<"directory" | "org">("directory");
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
    enabled: canManage && !!user?.companyId && view === "directory",
    placeholderData: (prev) => prev,
  });

  const orgQ = useQuery({
    queryKey: ["employees", "org", user?.companyId],
    queryFn: async () => {
      const res = await employeesApi.list({ page: 1, limit: 100 });
      return (res.data.data as { items: OrgPerson[] }).items;
    },
    enabled: canManage && !!user?.companyId && view === "org",
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
          <div className="mb-1 flex items-center gap-2 text-[var(--color-accent)]">
            <Users className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-xs font-semibold uppercase tracking-wider">Directory</span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Employees
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Green present · accent on leave · amber absent
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/70 p-1">
            <button
              type="button"
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                view === "directory"
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-muted)]"
              }`}
              onClick={() => setView("directory")}
            >
              Cards
            </button>
            <button
              type="button"
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                view === "org"
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-muted)]"
              }`}
              onClick={() => setView("org")}
            >
              Org chart
            </button>
          </div>
          {view === "directory" ? (
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees…"
                className="df-input w-52 py-2 pl-9 sm:w-64"
              />
            </label>
          ) : null}
          <button type="button" onClick={() => setCreateOpen(true)} className="df-btn df-btn-primary">
            <Plus className="h-4 w-4" strokeWidth={2} />
            New
          </button>
        </div>
      </div>

      {view === "org" ? (
        orgQ.isLoading ? (
          <SkeletonCards count={4} />
        ) : orgQ.error ? (
          <p className="df-card p-4 text-sm text-[var(--color-danger)]">Failed to load org chart.</p>
        ) : (
          <OrgChart
            people={orgQ.data ?? []}
            onSelect={(id) => navigate(`/employees/${id}`)}
          />
        )
      ) : (
        <>
          {isLoading ? <SkeletonCards count={6} /> : null}
          {error ? (
            <p className="df-card p-4 text-sm text-[var(--color-danger)]">Failed to load employees.</p>
          ) : null}
          {!isLoading && !error && rows.length === 0 ? (
            <EmptyState
              title="No employees yet"
              description="Add your first teammate to start attendance, leave, and payroll."
              actionLabel="Add employee"
              onAction={() => setCreateOpen(true)}
            />
          ) : null}

          {!isLoading && rows.length > 0 ? (
            <div
              className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${
                isFetching && !isLoading ? "opacity-70" : ""
              }`}
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
          ) : null}

          <PaginationControls page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

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
