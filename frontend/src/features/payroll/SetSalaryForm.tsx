/**
 * OWNER: Nidhish (Person B) — Admin sets wage & structure parameters.
 * Preview mirrors company salary policy (same rules the backend applies on save).
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormField } from "../../components/FormField.tsx";
import { payrollApi } from "../../api/payroll.ts";
import { getApiError } from "../../api/client.ts";
import { formatMoney } from "../../utils/format.ts";

type Props = {
  employeeId: string;
  mode?: "create" | "replace";
};

type PolicyComponent = {
  name: string;
  computationType: string;
  value: number | string | null;
  sequence: number;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Client preview mirroring backend computeComponents + company policy. */
function previewFromPolicy(monthlyWage: number, components: PolicyComponent[]) {
  const W = round2(monthlyWage);
  if (W <= 0 || components.length === 0) return [];

  const ordered = [...components].sort((a, b) => a.sequence - b.sequence);
  const nonBalance = ordered.filter((c) => c.computationType !== "BALANCE");
  const balanceComp = ordered.find((c) => c.computationType === "BALANCE");

  let basic = 0;
  let running = 0;
  const rows: { name: string; amount: number; rule: string }[] = [];

  for (const c of nonBalance) {
    const val = Number(c.value ?? 0);
    let amount = 0;
    let rule = "";
    if (c.computationType === "PERCENT_OF_WAGE") {
      amount = round2(W * (val / 100));
      rule = `${val}% of wage`;
    } else if (c.computationType === "PERCENT_OF_BASIC") {
      amount = round2(basic * (val / 100));
      rule = `${val}% of basic`;
    } else if (c.computationType === "FIXED_AMOUNT" || c.computationType === "FIXED") {
      amount = round2(val);
      rule = `Fixed ${formatMoney(val)}`;
    }
    if (c.name.toLowerCase() === "basic") basic = amount;
    running = round2(running + amount);
    rows.push({ name: c.name, amount, rule });
  }

  if (balanceComp) {
    rows.push({
      name: balanceComp.name,
      amount: round2(W - running),
      rule: "Balance (wage − others)",
    });
  }

  return rows;
}

export function SetSalaryForm({ employeeId, mode = "create" }: Props) {
  const qc = useQueryClient();
  const [monthlyWage, setMonthlyWage] = useState("50000");
  const [workingDays, setWorkingDays] = useState("5");
  const [breakHours, setBreakHours] = useState("1");
  const [pfEmployee, setPfEmployee] = useState("12");
  const [pfEmployer, setPfEmployer] = useState("12");
  const [professionalTax, setProfessionalTax] = useState("200");
  const [defaultsApplied, setDefaultsApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const policyQ = useQuery({
    queryKey: ["company-salary-policy"],
    queryFn: async () => (await payrollApi.getCompanySalaryPolicy()).data.data,
  });

  useEffect(() => {
    if (!policyQ.data || defaultsApplied) return;
    setPfEmployee(String(policyQ.data.pfEmployeeRate ?? 12));
    setPfEmployer(String(policyQ.data.pfEmployerRate ?? 12));
    setProfessionalTax(String(policyQ.data.professionalTax ?? 200));
    setDefaultsApplied(true);
  }, [policyQ.data, defaultsApplied]);

  const wageNum = Number(monthlyWage) || 0;
  const pfEmpRate = Number(pfEmployee) || 0;
  const pfErRate = Number(pfEmployer) || 0;
  const ptAmt = Number(professionalTax) || 0;

  const preview = useMemo(() => {
    const components = (policyQ.data?.components ?? []) as PolicyComponent[];
    return wageNum > 0 ? previewFromPolicy(wageNum, components) : [];
  }, [wageNum, policyQ.data?.components]);
  const exceeds = preview.some((c) => c.amount < 0);

  const basicAmt = preview.find((c) => c.name.toLowerCase() === "basic")?.amount ?? 0;
  const pfEmpAmt = round2(basicAmt * (pfEmpRate / 100));
  const pfErAmt = round2(basicAmt * (pfErRate / 100));
  const totalDeductions = round2(pfEmpAmt + ptAmt);
  const netSalary = round2(wageNum - totalDeductions);

  const saveMut = useMutation({
    mutationFn: () =>
      payrollApi.putSalaryStructure(employeeId, {
        monthlyWage: wageNum,
        workingDaysPerWeek: Number(workingDays) || 5,
        breakTimeHours: Number(breakHours) || 0,
        pfEmployeeRate: pfEmpRate,
        pfEmployerRate: pfErRate,
        professionalTax: ptAmt,
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["salary", employeeId] });
      await qc.invalidateQueries({ queryKey: ["salary-me"] });
    },
    onError: (err) => setError(getApiError(err).message),
  });

  return (
    <div className="df-card mt-4 space-y-4 border-dashed p-4">
      <p className="text-sm font-medium text-[var(--color-muted)]">
        {mode === "replace"
          ? "Update monthly wage and parameters — components & net salary recalculate from company policy."
          : "Set fixed monthly wage. Components follow the company salary policy automatically."}
      </p>
      {error ? <p className="text-sm font-medium text-[var(--color-danger)]">{error}</p> : null}
      {exceeds ? (
        <p className="text-sm font-medium text-[var(--color-danger)]">
          Non-balance components exceed this wage — raise the wage to proceed.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          label="Monthly wage (INR)"
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
          label="Employee PF (%)"
          name="pfEmployee"
          type="number"
          min={0}
          value={pfEmployee}
          onChange={(e) => setPfEmployee(e.target.value)}
        />
        <FormField
          label="Employer PF (%)"
          name="pfEmployer"
          type="number"
          min={0}
          value={pfEmployer}
          onChange={(e) => setPfEmployer(e.target.value)}
        />
        <FormField
          label="Professional Tax (INR)"
          name="professionalTax"
          type="number"
          min={0}
          value={professionalTax}
          onChange={(e) => setProfessionalTax(e.target.value)}
        />
      </div>

      {preview.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-bg)] text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Component</th>
                <th className="px-3 py-2 font-medium">Rule</th>
                <th className="px-3 py-2 text-right font-medium">Monthly amount</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((c) => (
                <tr key={c.name} className="border-t border-[var(--color-border)]">
                  <td className="px-3 py-1.5 font-medium">{c.name}</td>
                  <td className="px-3 py-1.5 text-[var(--color-muted)]">{c.rule}</td>
                  <td
                    className={`px-3 py-1.5 text-right tabular-nums ${
                      c.amount < 0 ? "font-bold text-[var(--color-danger)]" : ""
                    }`}
                  >
                    {formatMoney(c.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--color-border)] bg-[var(--color-bg)] font-semibold">
                <td className="px-3 py-2" colSpan={2}>
                  Gross monthly wage
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(wageNum)}</td>
              </tr>
              <tr className="border-t border-[var(--color-border)] text-xs text-[var(--color-danger)]">
                <td className="px-3 py-1.5" colSpan={2}>
                  Employee deductions (PF {pfEmpRate}% + PT {formatMoney(ptAmt)})
                </td>
                <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                  -{formatMoney(totalDeductions)}
                </td>
              </tr>
              <tr className="border-t border-[var(--color-border)] text-xs text-[var(--color-accent)]">
                <td className="px-3 py-1.5" colSpan={2}>
                  Employer contribution (PF {pfErRate}% — company paid)
                </td>
                <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                  {formatMoney(pfErAmt)}
                </td>
              </tr>
              <tr className="border-t-2 border-[var(--color-border)] bg-emerald-500/10 font-bold text-emerald-800 dark:text-emerald-300">
                <td className="px-3 py-2 text-base" colSpan={2}>
                  Estimated net take-home
                </td>
                <td className="px-3 py-2 text-right text-base tabular-nums">
                  {formatMoney(netSalary)}
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
        className="df-btn df-btn-primary disabled:opacity-50"
      >
        {saveMut.isPending
          ? "Saving salary structure…"
          : mode === "replace"
            ? "Update salary structure"
            : "Save salary structure"}
      </button>
    </div>
  );
}
