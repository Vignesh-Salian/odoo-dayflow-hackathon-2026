/**
 * OWNER: Vignesh (Person C)
 * Employee monthly attendance view (WF6).
 */
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "../../api/attendance.ts";
import { getApiError } from "../../api/client.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { StatusDot } from "./StatusDot.tsx";

function monthLabel(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function AttendancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [banner, setBanner] = useState<string | null>(null);
  const [regOpen, setRegOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    date: "",
    checkIn: "09:00",
    checkOut: "18:00",
    reason: "",
  });

  const isAdminHr = user?.role === "ADMIN" || user?.role === "HR";

  const { data, isLoading, error } = useQuery({
    queryKey: ["attendance", "me", month, year],
    queryFn: async () => {
      const res = await attendanceApi.me(month, year);
      return res.data.data;
    },
  });

  const checkInMut = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => {
      setBanner("Checked in successfully.");
      void qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err) => setBanner(getApiError(err).message),
  });

  const checkOutMut = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => {
      setBanner("Checked out successfully.");
      void qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err) => setBanner(getApiError(err).message),
  });

  const regularizeMut = useMutation({
    mutationFn: () => {
      const checkIn = new Date(`${regForm.date}T${regForm.checkIn}:00`);
      const checkOut = new Date(`${regForm.date}T${regForm.checkOut}:00`);
      return attendanceApi.regularize({
        date: regForm.date,
        requestedCheckIn: checkIn.toISOString(),
        requestedCheckOut: checkOut.toISOString(),
        reason: regForm.reason,
      });
    },
    onSuccess: () => {
      setBanner("Regularization request submitted.");
      setRegOpen(false);
      setRegForm({ date: "", checkIn: "09:00", checkOut: "18:00", reason: "" });
    },
    onError: (err) => setBanner(getApiError(err).message),
  });

  const todayRecord = useMemo(() => {
    const key = new Date().toISOString().slice(0, 10);
    return data?.records.find((r) => r.date === key) ?? null;
  }, [data]);

  const selfPresence = (() => {
    if (todayRecord?.checkIn && !todayRecord.checkOut) return "IN_OFFICE" as const;
    if (todayRecord?.checkIn && todayRecord.checkOut) return "CHECKED_OUT" as const;
    return "NOT_CHECKED_IN" as const;
  })();

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    setMonth(d.getUTCMonth() + 1);
    setYear(d.getUTCFullYear());
  }

  function onRegularize(e: FormEvent) {
    e.preventDefault();
    regularizeMut.mutate();
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Attendance
          </h1>
          <p className="mt-1 flex items-center gap-2 text-[var(--color-muted)]">
            Your monthly ledger
            <StatusDot status={selfPresence} showLabel />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdminHr ? (
            <Link
              to="/attendance/all"
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              Company day view
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => checkInMut.mutate()}
            disabled={checkInMut.isPending || !!todayRecord?.checkIn}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Check In
          </button>
          <button
            type="button"
            onClick={() => checkOutMut.mutate()}
            disabled={checkOutMut.isPending || !todayRecord?.checkIn || !!todayRecord?.checkOut}
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Check Out
          </button>
          <button
            type="button"
            onClick={() => setRegOpen((v) => !v)}
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            Regularize
          </button>
        </div>
      </div>

      {banner ? (
        <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
          {banner}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-sm"
          aria-label="Previous month"
        >
          ←
        </button>
        <h2 className="min-w-[10rem] text-center font-[family-name:var(--font-display)] text-xl font-semibold">
          {monthLabel(month, year)}
        </h2>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-sm"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {isLoading ? (
        <p className="text-[var(--color-muted)]">Loading attendance…</p>
      ) : error ? (
        <p className="text-[var(--color-danger)]">{getApiError(error).message}</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Days present" value={String(data.counts.daysPresent)} />
            <Stat label="Leave days" value={String(data.counts.leaveDays)} />
            <Stat label="Working days" value={String(data.counts.totalWorkingDays)} />
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-[var(--color-surface)] text-[var(--color-muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Check-In</th>
                  <th className="px-3 py-2 font-medium">Check-Out</th>
                  <th className="px-3 py-2 font-medium">Work Hrs</th>
                  <th className="px-3 py-2 font-medium">Extra</th>
                </tr>
              </thead>
              <tbody>
                {data.records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[var(--color-muted)]">
                      No attendance records this month.
                    </td>
                  </tr>
                ) : (
                  data.records.map((r) => (
                    <tr key={r.id} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-2">{r.date}</td>
                      <td className="px-3 py-2">{r.status}</td>
                      <td className="px-3 py-2">{formatTime(r.checkIn)}</td>
                      <td className="px-3 py-2">{formatTime(r.checkOut)}</td>
                      <td className="px-3 py-2">{r.workHours.toFixed(2)}</td>
                      <td className="px-3 py-2">{r.extraHours.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {regOpen ? (
        <form
          onSubmit={onRegularize}
          className="max-w-md space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Request regularization
          </h3>
          <label className="block text-sm">
            <span className="text-[var(--color-muted)]">Date</span>
            <input
              type="date"
              required
              value={regForm.date}
              onChange={(e) => setRegForm((f) => ({ ...f, date: e.target.value }))}
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-[var(--color-muted)]">Check-in</span>
              <input
                type="time"
                required
                value={regForm.checkIn}
                onChange={(e) => setRegForm((f) => ({ ...f, checkIn: e.target.value }))}
                className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--color-muted)]">Check-out</span>
              <input
                type="time"
                required
                value={regForm.checkOut}
                onChange={(e) => setRegForm((f) => ({ ...f, checkOut: e.target.value }))}
                className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-[var(--color-muted)]">Reason</span>
            <textarea
              required
              minLength={3}
              value={regForm.reason}
              onChange={(e) => setRegForm((f) => ({ ...f, reason: e.target.value }))}
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
              rows={3}
            />
          </label>
          <button
            type="submit"
            disabled={regularizeMut.isPending}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Submit request
          </button>
        </form>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">{value}</p>
    </div>
  );
}
