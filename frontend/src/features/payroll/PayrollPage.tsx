/**
 * OWNER: Nidhish (Person B)
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, FileText } from "lucide-react";
import { payrollApi } from "../../api/payroll.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { PaginationControls } from "../../components/PaginationControls.tsx";
import { EmptyState } from "../../components/EmptyState.tsx";
import { Skeleton } from "../../components/Skeleton.tsx";

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
      <div>
        <div className="mb-1 flex items-center gap-2 text-[var(--color-accent)]">
          <Banknote className="h-5 w-5" strokeWidth={1.75} />
          <span className="text-xs font-semibold uppercase tracking-wider">Compensation</span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Payroll
        </h1>
      </div>

      {canGenerate ? (
        <div className="df-card flex flex-wrap items-end gap-3 p-5">
          <label className="text-sm text-[var(--color-muted)]">
            Month
            <input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="df-input mt-1 block w-24 py-2"
            />
          </label>
          <label className="text-sm text-[var(--color-muted)]">
            Year
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="df-input mt-1 block w-28 py-2"
            />
          </label>
          <button
            type="button"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="df-btn df-btn-primary disabled:opacity-60"
          >
            {generate.isPending ? "Generating…" : "Generate payslips"}
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="font-semibold">My payslips</h2>
        {mine.isLoading ? (
          <div className="space-y-2" role="status" aria-label="Loading payslips">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="df-card flex items-center justify-between p-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : null}
        {!mine.isLoading && slips.length === 0 ? (
          <EmptyState
            title="No payslips yet"
            description="Generate payroll for a month to see slips here."
          />
        ) : null}
        <ul className="space-y-2">
          {slips.map((s) => (
            <li
              key={s.id}
              className="df-card flex items-center justify-between px-4 py-3 text-sm transition hover:border-[var(--color-accent)]/30"
            >
              <span className="font-medium">
                {s.month}/{s.year}
                <span className="ml-2 text-[var(--color-muted)]">
                  net {String(s.netPay)}
                </span>
              </span>
              <a
                className="inline-flex items-center gap-1.5 font-medium text-[var(--color-accent)] hover:underline"
                href={payrollApi.pdfUrl(s.id)}
              >
                <FileText className="h-4 w-4" strokeWidth={1.75} />
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
