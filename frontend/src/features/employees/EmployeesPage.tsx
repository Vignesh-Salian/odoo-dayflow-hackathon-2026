/**
 * OWNER: Nidhish (Person B)
 */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { employeesApi } from "../../api/employees.ts";
import { EmployeeCard } from "./EmployeeCard.tsx";
import { useAuth } from "../auth/AuthContext.tsx";

export function EmployeesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const canManage = user?.role === "ADMIN" || user?.role === "HR";

  const { data, isLoading, error } = useQuery({
    queryKey: ["employees", search],
    queryFn: async () => {
      const res = await employeesApi.list({ search: search || undefined, limit: 50 });
      return res.data.data;
    },
    enabled: canManage,
  });

  if (!canManage) {
    return (
      <section className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Employees</h1>
        <p className="text-[var(--color-muted)]">
          Employee directory is for Admin/HR. Go to{" "}
          <button type="button" className="text-[var(--color-accent)]" onClick={() => navigate("/me")}>
            My Profile
          </button>
          .
        </p>
      </section>
    );
  }

  const rows = (data as { items?: Array<Record<string, unknown>> })?.items ?? (Array.isArray(data) ? data : []);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Employees</h1>
          <p className="text-sm text-[var(--color-muted)]">Directory with live presence dots.</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
        />
      </div>
      {isLoading ? <p className="text-[var(--color-muted)]">Loading…</p> : null}
      {error ? <p className="text-[var(--color-danger)]">Failed to load employees.</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((emp) => {
          const id = String(emp.id ?? "");
          const name = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || "Employee";
          return (
            <EmployeeCard
              key={id}
              name={name}
              position={emp.jobPosition as string | null}
              presence={(emp.presence as "present" | "on_leave" | "absent") ?? "unknown"}
              onClick={() => navigate(`/employees/${id}`)}
            />
          );
        })}
      </div>
    </section>
  );
}
