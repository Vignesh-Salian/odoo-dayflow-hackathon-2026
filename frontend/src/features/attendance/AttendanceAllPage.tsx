/**
 * OWNER: Vignesh (Person C)
 * Admin/HR company day view (WF5).
 */
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "../../api/attendance.ts";
import { getApiError } from "../../api/client.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { StatusDot } from "./StatusDot.tsx";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function AttendanceAllPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayKey);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const isAdminHr = user?.role === "ADMIN" || user?.role === "HR";

  const { data, isLoading, error } = useQuery({
    queryKey: ["attendance", "day", date, search],
    queryFn: async () => {
      const res = await attendanceApi.dayView({ date, search, limit: 100 });
      return res.data.data;
    },
    enabled: isAdminHr,
  });

  const summary = useMemo(() => {
    if (!data) return null;
    const inOffice = data.items.filter((i) => i.presence === "IN_OFFICE").length;
    const onLeave = data.items.filter((i) => i.presence === "ON_LEAVE").length;
    const absent = data.items.filter(
      (i) => i.presence === "ABSENT" || i.presence === "NOT_CHECKED_IN",
    ).length;
    return { inOffice, onLeave, absent, total: data.total };
  }, [data]);

  if (!isAdminHr) {
    return <Navigate to="/attendance" replace />;
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Attendance — all
          </h1>
          <p className="mt-1 text-[var(--color-muted)]">Company day view with live presence</p>
        </div>
        <Link
          to="/attendance"
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          My monthly view
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setDate((d) => shiftDate(d, -1))}
          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-sm"
        >
          ←
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => setDate((d) => shiftDate(d, 1))}
          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-sm"
        >
          →
        </button>
        <button
          type="button"
          onClick={() => setDate(todayKey())}
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)]"
        >
          Today
        </button>
        <form
          className="ml-auto flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
        >
          <input
            type="search"
            placeholder="Search name or login ID"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-56 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white"
          >
            Search
          </button>
        </form>
      </div>

      {summary ? (
        <div className="flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
          <span>
            In office: <strong className="text-[var(--color-text)]">{summary.inOffice}</strong>
          </span>
          <span>
            On leave: <strong className="text-[var(--color-text)]">{summary.onLeave}</strong>
          </span>
          <span>
            Absent: <strong className="text-[var(--color-text)]">{summary.absent}</strong>
          </span>
          <span>
            Total: <strong className="text-[var(--color-text)]">{summary.total}</strong>
          </span>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-[var(--color-muted)]">Loading day view…</p>
      ) : error ? (
        <p className="text-[var(--color-danger)]">{getApiError(error).message}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-[var(--color-surface)] text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Employee</th>
                <th className="px-3 py-2 font-medium">Presence</th>
                <th className="px-3 py-2 font-medium">Check-In</th>
                <th className="px-3 py-2 font-medium">Check-Out</th>
                <th className="px-3 py-2 font-medium">Work Hours</th>
                <th className="px-3 py-2 font-medium">Extra Hours</th>
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-[var(--color-muted)]">
                    No employees found for this day.
                  </td>
                </tr>
              ) : (
                data.items.map((row) => (
                  <tr key={row.employeeId} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2">
                      <div className="font-medium">
                        {row.firstName} {row.lastName}
                      </div>
                      <div className="text-xs text-[var(--color-muted)]">{row.loginId}</div>
                    </td>
                    <td className="px-3 py-2">
                      <StatusDot status={row.presence} showLabel />
                    </td>
                    <td className="px-3 py-2">{formatTime(row.checkIn)}</td>
                    <td className="px-3 py-2">{formatTime(row.checkOut)}</td>
                    <td className="px-3 py-2">{row.workHours.toFixed(2)}</td>
                    <td className="px-3 py-2">{row.extraHours.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
