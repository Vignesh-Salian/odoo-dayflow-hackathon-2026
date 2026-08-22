/**
 * OWNER: Nidhish (Person B) — Admin sets wage; engine fills components (PDF Important rules).
 */
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormField } from "../../components/FormField.tsx";
import { payrollApi } from "../../api/payroll.ts";
import { getApiError } from "../../api/client.ts";
import { formatMoney } from "../../utils/format.ts";

type Props = {
  employeeId: string;
  mode?: "create" | "replace";
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Client preview mirroring backend defaultComponentTemplate + computeComponents. */
function previewComponents(monthlyWage: number) {
  const W = round2(monthlyWage);
  const basic = round2(W * 0.5);
  const hra = round2(basic * 0.5);
  const standard = 4167;
  const perf = round2(basic * 0.08333);
  const lta = round2(basic * 0.08333);
  const used = round2(basic + hra + standard + perf + lta);
  const fixed = round2(W - used);
  return [
    { name: "Basic", amount: basic, rule: "50% of wage" },
    { name: "House Rent Allowance", amount: hra, rule: "50% of basic" },
    { name: "Standard Allowance", amount: standard, rule: "Fixed ₹4,167" },
    { name: "Performance Bonus", amount: perf, rule: "8.333% of basic" },
    { name: "Leave Travel Allowance", amount: lta, rule: "8.333% of basic" },
    { name: "Fixed Allowance", amount: fixed, rule: "Balance (wage − others)" },
  ];
}

export function SetSalaryForm({ employeeId, mode = "create" }: Props) {
  const qc = useQueryClient();
  const [monthlyWage, setMonthlyWage] = useState("50000");
  const [workingDays, setWorkingDays] = useState("5");
  const [breakHours, setBreakHours] = useState("1");
  const [pfEmployee, setPfEmployee] = useState("12");
  const [pfEmployer, setPfEmployer] = useState("12");
  const [professionalTax, setProfessionalTax] = useState("200");
  const [error, setError] = useState<string | null>(null);

  const wageNum = Number(monthlyWage) || 0;
  const preview = useMemo(() => (wageNum > 0 ? previewComponents(wageNum) : []), [wageNum]);
  const exceeds = preview.some((c) => c.name === "Fixed Allowance" && c.amount < 0);

  const saveMut = useMutation({
    mutationFn: () =>
      payrollApi.putSalaryStructure(employeeId, {
        monthlyWage: wageNum,
        workingDaysPerWeek: Number(workingDays) || 5,
        breakTimeHours: Number(breakHours) || 0,
        pfEmployeeRate: Number(pfEmployee) || 12,
        pfEmployerRate: Number(pfEmployer) || 12,
        professionalTax: Number(professionalTax) || 0,
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["salary", employeeId] });
    },
    onError: (err) => setError(getApiError(err).message),
  });

  return (
    <div className="mt-4 space-y-4 rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-4">
      <p className="text-sm text-[var(--color-muted)]">
        {mode === "replace"
          ? "Update the monthly wage and schedule — components recalculate automatically so they still sum to the wage."
          : "Set a fixed monthly wage. Dayflow builds Basic / HRA / allowances (Fixed Allowance = remainder) so components always equal the wage."}
      </p>
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      {exceeds ? (
        <p className="text-sm text-[var(--color-danger)]">
          Non-balance components exceed this wage — raise the wage or components will fail to save.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          label="Month wage (INR)"
          name="monthlyWage"
          type="number"
          min={1}
          value={monthlyWage}
          onChange={(e) => setMonthlyWage(e.target.value)}
        />
        <FormField
          label="Working days / week"
          name="workingDays"
          type="number"
          min={1}
          max={7}
          value={workingDays}
          onChange={(e) => setWorkingDays(e.target.value)}
        />
        <FormField
          label="Break time (hrs)"
          name="breakHours"
          type="number"
          min={0}
          step={0.5}
          value={breakHours}
          onChange={(e) => setBreakHours(e.target.value)}
        />
        <FormField
          label="PF employee %"
          name="pfEmployee"
          type="number"
          min={0}
          value={pfEmployee}
          onChange={(e) => setPfEmployee(e.target.value)}
        />
        <FormField
          label="PF employer %"
          name="pfEmployer"
          type="number"
          min={0}
          value={pfEmployer}
          onChange={(e) => setPfEmployer(e.target.value)}
        />
        <FormField
          label="Professional tax"
          name="professionalTax"
          type="number"
          min={0}
          value={professionalTax}
          onChange={(e) => setProfessionalTax(e.target.value)}
        />
      </div>

      {preview.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface)] text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Component</th>
                <th className="px-3 py-2 font-medium">Rule</th>
                <th className="px-3 py-2 font-medium text-right">Preview</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((c) => (
                <tr key={c.name} className="border-t border-[var(--color-border)]">
                  <td className="px-3 py-1.5">{c.name}</td>
                  <td className="px-3 py-1.5 text-[var(--color-muted)]">{c.rule}</td>
                  <td
                    className={`px-3 py-1.5 text-right tabular-nums ${
                      c.amount < 0 ? "text-[var(--color-danger)]" : ""
                    }`}
                  >
                    {formatMoney(c.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2 font-semibold" colSpan={2}>
                  Yearly wage
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {formatMoney(wageNum * 12)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}

      <button
        type="button"
        disabled={saveMut.isPending || !monthlyWage || exceeds || wageNum <= 0}
        onClick={() => saveMut.mutate()}
        className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saveMut.isPending ? "Saving…" : mode === "replace" ? "Replace structure" : "Save salary structure"}
      </button>
    </div>
  );
}
