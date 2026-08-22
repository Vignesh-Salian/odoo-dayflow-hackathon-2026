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
import {
  Banknote,
  CalendarClock,
  ChartColumn,
  UserCheck,
  Users,
} from "lucide-react";
import { analyticsApi } from "../../api/analytics.ts";
import { getApiError } from "../../api/client.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { StatCard } from "../../components/StatCard.tsx";
import { SkeletonPage } from "../../components/Skeleton.tsx";

const PIE_COLORS = [
  "var(--color-accent)",
  "var(--color-tab)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
  "#94a3b8",
];

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

  const tooltipStyle = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
    color: "var(--color-text)",
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[var(--color-accent)]">
            <ChartColumn className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-xs font-semibold uppercase tracking-wider">Insights</span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Company snapshot{data ? ` · as of ${data.asOf}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="df-input w-auto py-2 text-sm"
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
            className="df-input w-24 py-2 text-sm"
            aria-label="Year"
          />
        </div>
      </div>

      {isLoading ? <SkeletonPage /> : null}
      {error ? (
        <p className="df-card p-4 text-sm text-[var(--color-danger)]">{getApiError(error).message}</p>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total employees"
              value={data.headcount}
              icon={<Users className="h-4.5 w-4.5" strokeWidth={1.75} />}
            />
            <StatCard
              label="Present today"
              value={data.presentToday}
              icon={<UserCheck className="h-4.5 w-4.5" strokeWidth={1.75} />}
            />
            <StatCard
              label="Pending leaves"
              value={data.pendingApprovals.leaves}
              hint={`${data.pendingApprovals.regularizations} regularizations`}
              icon={<CalendarClock className="h-4.5 w-4.5" strokeWidth={1.75} />}
            />
            <StatCard
              label="Payroll cost"
              value={`₹${data.payrollCost.monthlyStub.toLocaleString()}`}
              hint={data.payrollCost.note}
              icon={<Banknote className="h-4.5 w-4.5" strokeWidth={1.75} />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="df-card p-5">
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
                Department
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
                        innerRadius={52}
                        outerRadius={90}
                        paddingAngle={3}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {deptData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="df-card p-5">
              <h2 className="mb-1 font-[family-name:var(--font-display)] text-lg font-semibold">
                Trends · {data.period.month}/{data.period.year}
              </h2>
              <p className="mb-4 text-sm text-[var(--color-muted)]">
                Monthly attendance {data.attendance.percentage}% (
                {data.attendance.monthPresentDays} present-days / {data.attendance.workingDays}{" "}
                working days × headcount)
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendBars}>
                    <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} />
                    <YAxis stroke="var(--color-muted)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
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
