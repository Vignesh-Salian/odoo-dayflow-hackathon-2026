/**
 * OWNER: Nidhish (Person B)
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "../../api/payroll.ts";
import { useAuth } from "../auth/AuthContext.tsx";

export function PayrollPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canGenerate = user?.role === "ADMIN" || user?.role === "HR";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const mine = useQuery({
    queryKey: ["payslips-me"],
    queryFn: async () => (await payrollApi.myPayslips()).data.data,
  });

  const generate = useMutation({
    mutationFn: () => payrollApi.generatePayslips({ month, year }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payslips-me"] }),
  });

  const slips = (mine.data as unknown[]) ?? [];

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
        {mine.isLoading ? <p className="text-[var(--color-muted)]">Loading…</p> : null}
        <ul className="space-y-2">
          {(slips as Array<Record<string, unknown>>).map((s) => (
            <li
              key={String(s.id)}
              className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            >
              <span>
                {String(s.month)}/{String(s.year)} — net {String(s.netPay)}
              </span>
              <a className="text-[var(--color-accent)]" href={payrollApi.pdfUrl(String(s.id))}>
                PDF
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
