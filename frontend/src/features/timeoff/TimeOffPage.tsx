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
            ? "#eab308"
            : r.status === "REJECTED"
              ? "#64748b"
              : (r.leaveType?.color ?? "#8b5cf6"),
        status: r.status,
      })),
    [requestsQ.data],
  );

  const isManager = user?.role === "ADMIN" || user?.role === "HR";

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
            New request
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(allocationsQ.data ?? []).map((a) => (
          <StatCard
            key={a.id}
            label={a.leaveType.name}
            value={`${a.remainingDays} days`}
            hint={`${a.usedDays} used of ${a.allocatedDays}`}
            accent={a.leaveType.color ?? undefined}
          />
        ))}
        {allocationsQ.isLoading ? (
          <p className="text-sm text-[var(--color-muted)]">Loading balances…</p>
        ) : null}
      </div>

      <Calendar
        year={year}
        events={events}
        holidays={(holidaysQ.data ?? []).map((h) => ({ date: h.date, name: h.name }))}
      />

      <Modal
        open={modalOpen}
        title="Request time off"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
              onClick={() => setModalOpen(false)}
            >
              Cancel
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
          <SelectField
            label="Leave type"
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
              label="Start date"
              name="startDate"
              type="date"
              value={startDate}
              error={fields.startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <FormField
              label="End date"
              name="endDate"
              type="date"
              value={endDate}
              error={fields.endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
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
              <span className="text-sm text-[var(--color-muted)]">Attachment</span>
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
