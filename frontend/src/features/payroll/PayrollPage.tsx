/**
 * OWNER: Nidhish (Person B)
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "../../api/payroll.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { PaginationControls } from "../../components/PaginationControls.tsx";
import { LoadingState } from "../../components/LoadingState.tsx";
import { EmptyState } from "../../components/EmptyState.tsx";

const PAGE_SIZE = 10;

type PayslipRow = {
  id: string;
  month: number;
  year: number;
  netPay: string | number;
};

type MyPayslipsData = {
  items: PayslipRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export function PayrollPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canGenerate = user?.role === "ADMIN" || user?.role === "HR";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);

  const mine = useQuery({
    queryKey: ["payslips-me", page],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const res = await payrollApi.myPayslips({ page, limit: PAGE_SIZE });
      return res.data.data as MyPayslipsData;
    },
  });

  const generate = useMutation({
    mutationFn: () => payrollApi.generatePayslips({ month, year }),
    onSuccess: () => {
      setPage(1);
      void qc.invalidateQueries({ queryKey: ["payslips-me"] });
    },
  });

  const slips = mine.data?.items ?? [];
  const total = mine.data?.pagination.total ?? 0;

  return (
    <section className="space-y-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Payroll</h1>
      {canGenerate ? (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <label className="text-sm">
            Month
            <input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="mt-1 block w-24 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            Year
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="mt-1 block w-28 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5"
            />
          </label>
          <button
            type="button"
            onClick={() => generate.mutate()}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            {generate.isPending ? "Generating…" : "Generate payslips"}
          </button>
        </div>
      ) : null}
      <div className="space-y-2">
        <h2 className="font-semibold">My payslips</h2>
        {mine.isLoading ? <LoadingState label="Loading payslips…" /> : null}
        {!mine.isLoading && slips.length === 0 ? (
          <EmptyState title="No payslips yet" description="Generate payroll for a month to see slips here." />
        ) : null}
        <ul className="space-y-2">
          {slips.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            >
              <span>
                {s.month}/{s.year} — net {String(s.netPay)}
              </span>
              <a className="text-[var(--color-accent)]" href={payrollApi.pdfUrl(s.id)}>
                PDF
              </a>
            </li>
          ))}
        </ul>
        <PaginationControls page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </section>
  );
}
