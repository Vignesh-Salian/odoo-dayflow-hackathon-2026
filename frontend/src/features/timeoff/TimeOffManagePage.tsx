/**
 * OWNER: Prajwal (Person D)
 * Admin/HR leave approvals + allocations (WF7).
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { ApprovalButtons } from "../../components/ApprovalButtons.tsx";
import { DataTable, type DataTableColumn } from "../../components/DataTable.tsx";
import { FormField, SelectField } from "../../components/FormField.tsx";
import { Modal } from "../../components/Modal.tsx";
import { TabsPanel } from "../../components/TabsPanel.tsx";
import { PaginationControls } from "../../components/PaginationControls.tsx";
import { getApiError } from "../../api/client.ts";
import {
  timeoffApi,
  type LeaveAllocation,
  type LeaveRequest,
} from "../../api/timeoff.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.ts";

const REQUEST_PAGE_SIZE = 20;
const ALLOC_PAGE_SIZE = 20;

export function TimeOffManagePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("requests");
  const [status, setStatus] = useState("PENDING");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [reqPage, setReqPage] = useState(1);
  const [allocPage, setAllocPage] = useState(1);
  const [commentOpen, setCommentOpen] = useState<{
    id: string;
    decision: "approve" | "reject";
  } | null>(null);
  const [comment, setComment] = useState("");
  const [allocOpen, setAllocOpen] = useState(false);
  const [allocForm, setAllocForm] = useState({
    employeeId: "",
    leaveTypeId: "",
    year: String(new Date().getFullYear()),
    allocatedDays: "24",
  });
  const [allocError, setAllocError] = useState<string | null>(null);
  const [allocFields, setAllocFields] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const isManager = user?.role === "ADMIN" || user?.role === "HR";

  useEffect(() => {
    setReqPage(1);
  }, [status, debouncedSearch]);

  const requestsQ = useQuery({
    queryKey: ["leave-requests-all", status, debouncedSearch, reqPage],
    enabled: isManager,
    placeholderData: (prev) => prev,
    queryFn: async () =>
      (
        await timeoffApi.listRequests({
          status: status || undefined,
          search: debouncedSearch || undefined,
          page: reqPage,
          limit: REQUEST_PAGE_SIZE,
        })
      ).data.data,
  });

  const allocationsQ = useQuery({
    queryKey: ["leave-allocations-all", allocPage],
    enabled: isManager,
    placeholderData: (prev) => prev,
    queryFn: async () =>
      (
        await timeoffApi.listAllocations({
          year: new Date().getFullYear(),
          page: allocPage,
          limit: ALLOC_PAGE_SIZE,
        })
      ).data.data,
  });

  const typesQ = useQuery({
    queryKey: ["leave-types"],
    enabled: isManager,
    queryFn: async () => (await timeoffApi.leaveTypes()).data.data,
  });

  const balanceChips = useMemo(() => {
    const types = typesQ.data ?? [];
    const paid =
      types.find((t) => t.code === "PTO" || /paid/i.test(t.name)) ?? null;
    const sick =
      types.find((t) => t.code === "SICK" || /sick/i.test(t.name)) ?? null;
    return [
      paid
        ? {
            label: "Paid time off",
            days: paid.defaultAllocation,
          }
        : null,
      sick
        ? {
            label: "Sick time off",
            days: sick.defaultAllocation,
          }
        : null,
    ].filter(Boolean) as { label: string; days: number }[];
  }, [typesQ.data]);

  const decideMut = useMutation({
    mutationFn: async () => {
      if (!commentOpen) throw new Error("No request");
      if (commentOpen.decision === "approve") {
        return timeoffApi.approve(commentOpen.id, comment || undefined);
      }
      return timeoffApi.reject(commentOpen.id, comment || undefined);
    },
    onSuccess: async () => {
      setCommentOpen(null);
      setComment("");
      setActionError(null);
      await qc.invalidateQueries({ queryKey: ["leave-requests-all"] });
      await qc.invalidateQueries({ queryKey: ["leave-allocations-me"] });
    },
    onError: (err) => {
      setActionError(getApiError(err).message);
    },
  });

  const allocMut = useMutation({
    mutationFn: () =>
      timeoffApi.createAllocation({
        employeeId: allocForm.employeeId,
        leaveTypeId: allocForm.leaveTypeId,
        year: Number(allocForm.year),
        allocatedDays: Number(allocForm.allocatedDays),
      }),
    onSuccess: async () => {
      setAllocOpen(false);
      setAllocError(null);
      setAllocFields({});
      await qc.invalidateQueries({ queryKey: ["leave-allocations-all"] });
    },
    onError: (err) => {
      const e = getApiError(err);
      setAllocError(e.message);
      setAllocFields(e.fields ?? {});
    },
  });

  const requestColumns: DataTableColumn<LeaveRequest>[] = useMemo(
    () => [
      {
        key: "employee",
        header: "Name",
        render: (r) =>
          r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : r.employeeId.slice(0, 8),
      },
      {
        key: "start",
        header: "Start Date",
        render: (r) => <span className="tabular-nums">{r.startDate}</span>,
      },
      {
        key: "end",
        header: "End Date",
        render: (r) => <span className="tabular-nums">{r.endDate}</span>,
      },
      {
        key: "type",
        header: "Time off Type",
        render: (r) => (
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: r.leaveType?.color ?? "#8b5cf6" }}
            />
            {r.leaveType?.name ?? "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Status",
        render: (r) =>
          r.status === "PENDING" ? (
            <ApprovalButtons
              onApprove={() => {
                setActionError(null);
                setComment("");
                setCommentOpen({ id: r.id, decision: "approve" });
              }}
              onReject={() => {
                setActionError(null);
                setComment("");
                setCommentOpen({ id: r.id, decision: "reject" });
              }}
              loading={decideMut.isPending}
            />
          ) : (
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                r.status === "APPROVED"
                  ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                  : "bg-[var(--color-muted)]/20 text-[var(--color-muted)]"
              }`}
            >
              {r.status}
            </span>
          ),
      },
    ],
    [decideMut.isPending],
  );

  const allocationColumns: DataTableColumn<LeaveAllocation>[] = useMemo(
    () => [
      {
        key: "employee",
        header: "Employee",
        render: (a) =>
          a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : a.employeeId.slice(0, 8),
      },
      {
        key: "type",
        header: "Leave type",
        render: (a) => a.leaveType.name,
      },
      {
        key: "year",
        header: "Year",
        render: (a) => a.year,
      },
      {
        key: "allocated",
        header: "Allocated",
        render: (a) => a.allocatedDays,
      },
      {
        key: "used",
        header: "Used",
        render: (a) => a.usedDays,
      },
      {
        key: "remaining",
        header: "Remaining",
        render: (a) => (
          <span className="font-semibold tabular-nums text-[var(--color-success)]">
            {a.remainingDays}
          </span>
        ),
      },
    ],
    [],
  );

  if (!isManager) {
    return <Navigate to="/timeoff" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            Manage Time Off
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Approve or reject requests and adjust yearly allocations.
          </p>
        </div>
        <Link to="/timeoff" className="text-sm text-[var(--color-tab)] hover:underline">
          ← My calendar
        </Link>
      </div>

      <TabsPanel
        activeId={tab}
        onChange={setTab}
        tabs={[
          {
            id: "requests",
            label: "Time Off",
            content: (
              <div className="space-y-4">
                {balanceChips.length > 0 ? (
                  <div className="flex flex-wrap gap-4 text-sm font-medium text-[var(--color-tab)]">
                    {balanceChips.map((c) => (
                      <span key={c.label}>
                        {c.label}: {c.days} Days Available
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <SelectField
                    label="Status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="min-w-[160px]"
                  >
                    <option value="">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </SelectField>
                  <FormField
                    label="Searchbar"
                    name="search"
                    value={search}
                    placeholder="Name…"
                    onChange={(e) => setSearch(e.target.value)}
                    className="min-w-[200px]"
                  />
                </div>
                <DataTable
                  columns={requestColumns}
                  rows={requestsQ.data?.items ?? []}
                  rowKey={(r) => r.id}
                  loading={requestsQ.isLoading}
                  emptyMessage="No leave requests match these filters."
                />
                <PaginationControls
                  page={reqPage}
                  limit={REQUEST_PAGE_SIZE}
                  total={requestsQ.data?.total ?? 0}
                  onPageChange={setReqPage}
                />
              </div>
            ),
          },
          {
            id: "allocations",
            label: "Allocation",
            content: (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setAllocError(null);
                    setAllocFields({});
                    setAllocOpen(true);
                  }}
                  className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  NEW
                </button>
                <DataTable
                  columns={allocationColumns}
                  rows={allocationsQ.data?.items ?? []}
                  rowKey={(a) => a.id}
                  loading={allocationsQ.isLoading}
                  emptyMessage="No allocations for this year."
                />
                <PaginationControls
                  page={allocPage}
                  limit={ALLOC_PAGE_SIZE}
                  total={allocationsQ.data?.total ?? 0}
                  onPageChange={setAllocPage}
                />
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={!!commentOpen}
        title={commentOpen?.decision === "approve" ? "Approve leave" : "Reject leave"}
        onClose={() => setCommentOpen(null)}
        footer={
          <>
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm text-[var(--color-muted)]"
              onClick={() => setCommentOpen(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={decideMut.isPending}
              onClick={() => decideMut.mutate()}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                commentOpen?.decision === "approve"
                  ? "bg-[var(--color-success)]"
                  : "bg-[var(--color-danger)]"
              }`}
            >
              {decideMut.isPending ? "Saving…" : "Confirm"}
            </button>
          </>
        }
      >
        {actionError ? (
          <p className="mb-3 text-sm text-[var(--color-danger)]">{actionError}</p>
        ) : null}
        <FormField
          label="Comment (optional)"
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Visible to the employee"
        />
      </Modal>

      <Modal
        open={allocOpen}
        title="Set leave allocation"
        onClose={() => setAllocOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm text-[var(--color-muted)]"
              onClick={() => setAllocOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={allocMut.isPending}
              onClick={() => allocMut.mutate()}
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {allocMut.isPending ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {allocError ? (
            <p className="text-sm text-[var(--color-danger)]">{allocError}</p>
          ) : null}
          <FormField
            label="Employee ID (UUID)"
            name="employeeId"
            value={allocForm.employeeId}
            error={allocFields.employeeId}
            onChange={(e) => setAllocForm((f) => ({ ...f, employeeId: e.target.value }))}
            placeholder="Paste employee UUID"
          />
          <SelectField
            label="Leave type"
            name="leaveTypeId"
            value={allocForm.leaveTypeId}
            error={allocFields.leaveTypeId}
            onChange={(e) => setAllocForm((f) => ({ ...f, leaveTypeId: e.target.value }))}
          >
            <option value="">Select…</option>
            {(typesQ.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </SelectField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Year"
              name="year"
              type="number"
              value={allocForm.year}
              error={allocFields.year}
              onChange={(e) => setAllocForm((f) => ({ ...f, year: e.target.value }))}
            />
            <FormField
              label="Allocated days"
              name="allocatedDays"
              type="number"
              step="0.5"
              value={allocForm.allocatedDays}
              error={allocFields.allocatedDays}
              onChange={(e) => setAllocForm((f) => ({ ...f, allocatedDays: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
