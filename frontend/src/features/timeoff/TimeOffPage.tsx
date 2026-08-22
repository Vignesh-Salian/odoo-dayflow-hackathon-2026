/**
 * OWNER: Prajwal (Person D)
 * Employee time-off calendar + balances + request modal (WF8).
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  Plus,
  PartyPopper,
} from "lucide-react";
import { Calendar } from "../../components/Calendar.tsx";
import { FormField, SelectField, TextAreaField } from "../../components/FormField.tsx";
import { Modal } from "../../components/Modal.tsx";
import { StatCard } from "../../components/StatCard.tsx";
import { SkeletonStats } from "../../components/Skeleton.tsx";
import { getApiError } from "../../api/client.ts";
import { timeoffApi, type LeaveType } from "../../api/timeoff.ts";
import { useAuth } from "../auth/AuthContext.tsx";

/** Weekdays minus public holidays (matches backend leave day counting). */
function countLeaveDays(startDate: string, endDate: string, holidayDates: Set<string>) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  let days = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6 && !holidayDates.has(key)) days += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function statusBadge(status: string) {
  if (status === "APPROVED") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  }
  if (status === "REJECTED") {
    return "bg-rose-500/15 text-rose-700 dark:text-rose-400";
  }
  return "bg-sky-500/15 text-sky-700 dark:text-sky-400";
}

export function TimeOffPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const year = new Date().getFullYear();
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const allocationsQ = useQuery({
    queryKey: ["leave-allocations-me", year],
    queryFn: async () => (await timeoffApi.myAllocations(year)).data.data,
  });

  const typesQ = useQuery({
    queryKey: ["leave-types"],
    queryFn: async () => (await timeoffApi.leaveTypes()).data.data,
  });

  const requestsQ = useQuery({
    queryKey: ["leave-requests-me", year],
    queryFn: async () => (await timeoffApi.myRequests(year)).data.data,
  });

  const holidaysQ = useQuery({
    queryKey: ["public-holidays", year],
    queryFn: async () => (await timeoffApi.publicHolidays(year)).data.data,
  });

  const selectedType: LeaveType | undefined = typesQ.data?.find((t) => t.id === leaveTypeId);

  const holidaySet = useMemo(
    () => new Set((holidaysQ.data ?? []).map((h) => h.date.slice(0, 10))),
    [holidaysQ.data],
  );

  const previewDays = useMemo(
    () => countLeaveDays(startDate, endDate, holidaySet),
    [startDate, endDate, holidaySet],
  );

  const createMut = useMutation({
    mutationFn: () =>
      timeoffApi.createRequest({
        leaveTypeId,
        startDate,
        endDate,
        reason: reason || undefined,
        attachment,
      }),
    onSuccess: async () => {
      setModalOpen(false);
      resetForm();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["leave-requests-me"] }),
        qc.invalidateQueries({ queryKey: ["leave-allocations-me"] }),
      ]);
    },
    onError: (err) => {
      const e = getApiError(err);
      setFormError(e.message);
      setFields(e.fields ?? {});
    },
  });

  function resetForm() {
    setLeaveTypeId("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setAttachment(null);
    setFields({});
    setFormError(null);
  }

  const events = useMemo(
    () =>
      (requestsQ.data ?? []).map((r) => ({
        id: r.id,
        startDate: r.startDate,
        endDate: r.endDate,
        label: r.leaveType?.name ?? "Leave",
        color:
          r.status === "PENDING"
            ? "#3b82f6"
            : r.status === "REJECTED"
              ? "#ef4444"
              : "#22c55e",
        status: r.status,
      })),
    [requestsQ.data],
  );

  const isManager = user?.role === "ADMIN" || user?.role === "HR";
  const holidays = [...(holidaysQ.data ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const recentRequests = [...(requestsQ.data ?? [])]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[var(--color-accent)]">
            <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-xs font-semibold uppercase tracking-wider">Leave</span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Time Off
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Your {year} leave calendar. Weekends and public holidays never count against balance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isManager ? (
            <Link
              to="/timeoff/manage"
              className="df-btn border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <ClipboardList className="h-4 w-4" strokeWidth={1.75} />
              Manage requests
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="df-btn df-btn-primary"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New request
          </button>
        </div>
      </div>

      {allocationsQ.isLoading ? (
        <SkeletonStats count={3} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(allocationsQ.data ?? []).map((a) => {
            const usedPct =
              a.allocatedDays > 0
                ? Math.min(100, Math.round((a.usedDays / a.allocatedDays) * 100))
                : 0;
            return (
              <StatCard
                key={a.id}
                label={a.leaveType.name}
                value={`${a.remainingDays} days`}
                hint={`${a.usedDays} used of ${a.allocatedDays} · ${usedPct}% used`}
                accent={a.leaveType.color ?? undefined}
                icon={<CalendarDays className="h-4 w-4" strokeWidth={1.75} />}
              />
            );
          })}
          {(allocationsQ.data ?? []).length === 0 ? (
            <div className="df-card col-span-full p-6 text-center text-sm text-[var(--color-muted)]">
              No leave balances allocated for {year} yet.
            </div>
          ) : null}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <div className="df-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm font-medium">Year calendar</p>
            <div className="flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Approved
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Pending
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Refused
              </span>
            </div>
          </div>
          <Calendar
            year={year}
            events={events}
            holidays={(holidaysQ.data ?? []).map((h) => ({ date: h.date, name: h.name }))}
          />
        </div>

        <aside className="space-y-4">
          <div className="df-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <PartyPopper className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <h2 className="text-sm font-semibold">Public holidays</h2>
            </div>
            {holidaysQ.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="skeleton h-8 w-full rounded-lg" />
                ))}
              </div>
            ) : holidays.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No holidays listed for {year}.</p>
            ) : (
              <ul className="max-h-[18rem] space-y-1.5 overflow-y-auto">
                {holidays.map((h) => (
                  <li
                    key={h.id ?? h.date + h.name}
                    className="flex items-center justify-between gap-2 rounded-xl bg-[var(--color-surface-2)]/70 px-3 py-2 text-sm"
                  >
                    <span className="font-medium tabular-nums text-[var(--color-muted)]">
                      {new Date(`${h.date.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="truncate text-right">{h.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="df-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <ClipboardList className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <h2 className="text-sm font-semibold">Recent requests</h2>
            </div>
            {requestsQ.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="skeleton h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : recentRequests.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No leave requests yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentRequests.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{r.leaveType?.name ?? "Leave"}</p>
                      <span className={`df-badge ${statusBadge(r.status)}`}>{r.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {r.startDate.slice(0, 10)} → {r.endDate.slice(0, 10)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <Modal
        open={modalOpen}
        title="Request time off"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="df-btn df-btn-ghost"
              onClick={() => setModalOpen(false)}
            >
              Discard
            </button>
            <button
              type="button"
              disabled={createMut.isPending || !leaveTypeId || !startDate || !endDate}
              onClick={() => {
                setFormError(null);
                setFields({});
                createMut.mutate();
              }}
              className="df-btn df-btn-primary disabled:opacity-50"
            >
              {createMut.isPending ? "Submitting…" : "Submit"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? (
            <p className="rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
              {formError}
            </p>
          ) : null}
          <p className="text-sm text-[var(--color-muted)]">
            Employee:{" "}
            <strong className="text-[var(--color-text)]">
              {user?.firstName} {user?.lastName}
            </strong>
          </p>
          <SelectField
            label="Time off type"
            name="leaveTypeId"
            value={leaveTypeId}
            error={fields.leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
          >
            <option value="">Select type…</option>
            {(typesQ.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.requiresAttachment ? " (attachment required)" : ""}
              </option>
            ))}
          </SelectField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="From"
              name="startDate"
              type="date"
              value={startDate}
              error={fields.startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <FormField
              label="To"
              name="endDate"
              type="date"
              value={endDate}
              error={fields.endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm">
            Allocation:{" "}
            <strong className="tabular-nums">{previewDays.toFixed(2)} Days</strong>
            <span className="text-[var(--color-muted)]"> (weekdays, excluding holidays)</span>
          </p>
          <TextAreaField
            label="Reason (optional)"
            name="reason"
            value={reason}
            error={fields.reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          {selectedType?.requiresAttachment ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-muted)]">
                Attachment (sick leave certificate)
              </span>
              <input
                type="file"
                name="attachment"
                accept=".pdf,.png,.jpg,.jpeg"
                className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-surface-2)] file:px-3 file:py-1.5"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              />
              {fields.attachment ? (
                <span className="block text-xs text-[var(--color-danger)]">{fields.attachment}</span>
              ) : null}
            </label>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
