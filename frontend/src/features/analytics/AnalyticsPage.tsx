/**
 * OWNER: Vignesh (Person C)
 * Analytics dashboard — headcount, present today, pending leaves, payroll cost stub.
 */
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyticsApi } from "../../api/analytics.ts";
import { getApiError } from "../../api/client.ts";
import { useAuth } from "../auth/AuthContext.tsx";

const PIE_COLORS = ["#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8"];

export function AnalyticsPage() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const isAdminHr = user?.role === "ADMIN" || user?.role === "HR";

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", "dashboard", month, year],
    queryFn: async () => {
      const res = await analyticsApi.dashboard({ month, year });
      return res.data.data;
    },
    enabled: isAdminHr,
  });

  if (!isAdminHr) {
    return <Navigate to="/employees" replace />;
  }

  const deptData =
    data?.headcountByDepartment.map((d) => ({
      name: d.name,
      value: d.count,
    })) ?? [];

  const trendBars = data
    ? [
        { name: "Present", value: data.presentToday },
        { name: "Headcount", value: data.headcount },
        { name: "Att %", value: data.attendance.percentage },
      ]
    : [];

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Analytics
          </h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Company snapshot{data ? ` · as of ${data.asOf}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm"
            aria-label="Month"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString(undefined, { month: "short" })}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm"
            aria-label="Year"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-[var(--color-muted)]">Loading analytics…</p>
      ) : error ? (
        <p className="text-[var(--color-danger)]">{getApiError(error).message}</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Headcount" value={String(data.headcount)} />
            <Metric label="Present today" value={String(data.presentToday)} />
            <Metric
              label="Pending leaves"
              value={String(data.pendingApprovals.leaves)}
              hint={`${data.pendingApprovals.regularizations} regularizations`}
            />
            <Metric
              label="Payroll cost (stub)"
              value={`₹${data.payrollCost.monthlyStub.toLocaleString()}`}
              hint={data.payrollCost.note}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
                Headcount by department
              </h2>
              {deptData.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">No departments yet.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deptData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {deptData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#1a1a1a",
                          border: "1px solid #2e2e2e",
                          borderRadius: 8,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
                Trends · {data.period.month}/{data.period.year}
              </h2>
              <p className="mb-3 text-sm text-[var(--color-muted)]">
                Monthly attendance {data.attendance.percentage}% ({data.attendance.monthPresentDays}{" "}
                present-days / {data.attendance.workingDays} working days × headcount)
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendBars}>
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                    <YAxis stroke="#a1a1aa" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1a",
                        border: "1px solid #2e2e2e",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p> : null}
    </div>
  );
}
