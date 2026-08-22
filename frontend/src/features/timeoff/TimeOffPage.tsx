/**
 * OWNER: Prajwal (Person D)
 * Employee time-off calendar + balances + request modal (WF8).
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar } from "../../components/Calendar.tsx";
import { FormField, SelectField, TextAreaField } from "../../components/FormField.tsx";
import { Modal } from "../../components/Modal.tsx";
import { StatCard } from "../../components/StatCard.tsx";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
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
              className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-tab)] hover:text-[var(--color-tab)]"
            >
              Manage requests
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            NEW
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(allocationsQ.data ?? []).map((a) => (
          <StatCard
            key={a.id}
            label={a.leaveType.name}
            value={`${a.remainingDays} Days Available`}
            hint={`${a.usedDays} used of ${a.allocatedDays}`}
            accent={a.leaveType.color ?? undefined}
          />
        ))}
        {allocationsQ.isLoading ? (
          <p className="text-sm text-[var(--color-muted)]">Loading balances…</p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <Calendar
          year={year}
          events={events}
          holidays={(holidaysQ.data ?? []).map((h) => ({ date: h.date, name: h.name }))}
        />
        <aside className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-tab)]">Public holidays</h2>
          {holidays.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No holidays listed for {year}.</p>
          ) : (
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto text-sm">
              {holidays.map((h) => (
                <li key={h.id ?? h.date + h.name} className="flex justify-between gap-2">
                  <span className="text-[var(--color-muted)]">
                    {new Date(`${h.date.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-right">{h.name}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted)]">
            Green = approved · Blue = pending · Red = refused
          </p>
        </aside>
      </div>

      <Modal
        open={modalOpen}
        title="Time off Type Request"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
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
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {createMut.isPending ? "Submitting…" : "Submit"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? (
            <p className="rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
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
            label="Time off Type"
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
          <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
            Allocation:{" "}
            <strong className="tabular-nums">
              {previewDays.toFixed(2)} Days
            </strong>
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
              <span className="text-sm text-[var(--color-muted)]">
                Attachment (For sick leave certificate)
              </span>
              <input
                type="file"
                name="attachment"
                accept=".pdf,.png,.jpg,.jpeg"
                className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-surface-2)] file:px-3 file:py-1.5"
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
