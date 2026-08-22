/**
 * Company Salary Policy Configuration & Live Preview UI.
 * Allows Company Admin to configure company-specific salary rules & rates.
 */
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "../../api/payroll.ts";
import { getApiError } from "../../api/client.ts";
import { formatMoney } from "../../utils/format.ts";
import { LoadingState } from "../../components/LoadingState.tsx";
import { FormField } from "../../components/FormField.tsx";

type PolicyComponent = {
  name: string;
  computationType: "PERCENT_OF_WAGE" | "PERCENT_OF_BASIC" | "FIXED_AMOUNT" | "BALANCE";
  value: number | null;
  sequence: number;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function CompanySalaryPolicyPage() {
  const qc = useQueryClient();
  const [sampleWage, setSampleWage] = useState("50000");
  const [pfEmpRate, setPfEmpRate] = useState("12");
  const [pfErRate, setPfErRate] = useState("12");
  const [pt, setPt] = useState("200");
  const [components, setComponents] = useState<PolicyComponent[]>([
    { name: "Basic", computationType: "PERCENT_OF_WAGE", value: 50, sequence: 1 },
    { name: "House Rent Allowance", computationType: "PERCENT_OF_BASIC", value: 50, sequence: 2 },
    { name: "Standard Allowance", computationType: "FIXED_AMOUNT", value: 4167, sequence: 3 },
    { name: "Performance Bonus", computationType: "PERCENT_OF_BASIC", value: 8.333, sequence: 4 },
    { name: "Leave Travel Allowance", computationType: "PERCENT_OF_BASIC", value: 8.333, sequence: 5 },
    { name: "Fixed Allowance", computationType: "BALANCE", value: null, sequence: 6 },
  ]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const policyQuery = useQuery({
    queryKey: ["company-salary-policy"],
    queryFn: async () => {
      const res = await payrollApi.getCompanySalaryPolicy();
      return res.data.data;
    },
  });

  useEffect(() => {
    if (policyQuery.data) {
      setPfEmpRate(String(policyQuery.data.pfEmployeeRate ?? 12));
      setPfErRate(String(policyQuery.data.pfEmployerRate ?? 12));
      setPt(String(policyQuery.data.professionalTax ?? 200));
      if (policyQuery.data.components && policyQuery.data.components.length > 0) {
        setComponents(
          policyQuery.data.components.map((c: any) => ({
            name: c.name,
            computationType: c.computationType,
            value: c.value != null ? Number(c.value) : null,
            sequence: c.sequence,
          }))
        );
      }
    }
  }, [policyQuery.data]);

  const updateComponentValue = (index: number, val: string) => {
    setComponents((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index]!, value: val === "" ? null : Number(val) };
      return copy;
    });
  };

  const updateComponentType = (index: number, type: any) => {
    setComponents((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index]!,
        computationType: type,
        value: type === "BALANCE" ? null : copy[index]!.value ?? 0,
      };
      return copy;
    });
  };

  // Real-time Live Salary Engine Preview for sample wage
  const W = Number(sampleWage) || 0;
  const computedPreview = useMemo(() => {
    if (W <= 0) return [];
    let basicAmt = 0;
    let running = 0;
    const result: { name: string; type: string; ruleText: string; amount: number }[] = [];

    const nonBalance = components.filter((c) => c.computationType !== "BALANCE");
    const balanceComp = components.find((c) => c.computationType === "BALANCE");

    for (const c of nonBalance) {
      let amount = 0;
      let ruleText = "";
      const val = c.value ?? 0;
      if (c.computationType === "PERCENT_OF_WAGE") {
        amount = round2(W * (val / 100));
        ruleText = `${val}% of Monthly Wage`;
      } else if (c.computationType === "PERCENT_OF_BASIC") {
        amount = round2(basicAmt * (val / 100));
        ruleText = `${val}% of Basic Salary`;
      } else if (c.computationType === "FIXED_AMOUNT") {
        amount = round2(val);
        ruleText = `Fixed Amount (${formatMoney(val)})`;
      }

      if (c.name.toLowerCase() === "basic") {
        basicAmt = amount;
      }
      running = round2(running + amount);
      result.push({ name: c.name, type: c.computationType, ruleText, amount });
    }

    if (balanceComp) {
      const balAmt = round2(W - running);
      result.push({
        name: balanceComp.name,
        type: "BALANCE",
        ruleText: "Residual Balance (Wage - Others)",
        amount: balAmt,
      });
    }

    return result;
  }, [W, components]);

  const basicForPf = computedPreview.find((c) => c.name.toLowerCase() === "basic")?.amount ?? 0;
  const pfEmpAmt = round2(basicForPf * (Number(pfEmpRate) / 100));
  const pfErAmt = round2(basicForPf * (Number(pfErRate) / 100));
  const ptAmt = Number(pt) || 0;
  const totalDeductions = round2(pfEmpAmt + ptAmt);
  const netTakeHome = round2(W - totalDeductions);
  const exceeds = computedPreview.some((c) => c.type === "BALANCE" && c.amount < 0);

  const saveMutation = useMutation({
    mutationFn: () =>
      payrollApi.putCompanySalaryPolicy({
        pfEmployeeRate: Number(pfEmpRate) || 0,
        pfEmployerRate: Number(pfErRate) || 0,
        professionalTax: ptAmt,
        components,
      }),
    onSuccess: async () => {
      setSaveSuccess(true);
      setError(null);
      await qc.invalidateQueries({ queryKey: ["company-salary-policy"] });
      setTimeout(() => setSaveSuccess(false), 4000);
    },
    onError: (err) => {
      setError(getApiError(err).message);
    },
  });

  if (policyQuery.isLoading) return <LoadingState label="Loading company salary policy…" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">Company Salary Policy</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Configure company-wide salary calculation rules, allowance percentages, and statutory deduction rates.
        </p>
      </div>

      {saveSuccess ? (
        <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-sm font-semibold text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
          ✓ Company Salary Policy updated successfully! Future salary structures will calculate using these rules.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md bg-rose-50 dark:bg-rose-950/40 p-3.5 text-sm font-semibold text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
          ⚠ {error}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left 7 cols: Policy Editor */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">1. Component Calculation Rules</h2>
            <div className="space-y-4">
              {components.map((comp, idx) => (
                <div key={comp.name} className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3.5 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm">{comp.name}</p>
                    <span className="text-xs text-[var(--color-muted)] font-mono">Seq {comp.sequence}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Calculation Type</label>
                      <select
                        disabled={comp.computationType === "BALANCE"}
                        value={comp.computationType}
                        onChange={(e) => updateComponentType(idx, e.target.value)}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm"
                      >
                        <option value="PERCENT_OF_WAGE">% of Monthly Wage</option>
                        <option value="PERCENT_OF_BASIC">% of Basic Salary</option>
                        <option value="FIXED_AMOUNT">Fixed Amount (INR)</option>
                        <option value="BALANCE">Residual Balance</option>
                      </select>
                    </div>
                    {comp.computationType !== "BALANCE" ? (
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                          {comp.computationType.startsWith("PERCENT") ? "Percentage (%)" : "Fixed Amount (INR)"}
                        </label>
                        <input
                          type="number"
                          step={comp.computationType.startsWith("PERCENT") ? "0.1" : "1"}
                          value={comp.value ?? ""}
                          onChange={(e) => updateComponentValue(idx, e.target.value)}
                          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-[var(--color-muted)] italic pt-5">
                        Absorbs remainder (Wage - other components)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">2. Statutory Deductions Policy</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Employee PF Rate (%)"
                name="pfEmpRate"
                type="number"
                min={0}
                max={100}
                value={pfEmpRate}
                onChange={(e) => setPfEmpRate(e.target.value)}
              />
              <FormField
                label="Employer PF Rate (%)"
                name="pfErRate"
                type="number"
                min={0}
                max={100}
                value={pfErRate}
                onChange={(e) => setPfErRate(e.target.value)}
              />
              <FormField
                label="Professional Tax (INR)"
                name="pt"
                type="number"
                min={0}
                value={pt}
                onChange={(e) => setPt(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={saveMutation.isPending || exceeds}
            onClick={() => saveMutation.mutate()}
            className="rounded-md bg-[var(--color-accent)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving Policy…" : "Save Company Salary Policy"}
          </button>
        </div>

        {/* Right 5 cols: Live Policy Impact Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--color-text)]">Live Policy Impact Preview</h2>
              <span className="rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold px-2 py-0.5">
                Real-Time
              </span>
            </div>

            <p className="text-xs text-[var(--color-muted)]">
              Enter a sample employee monthly wage to preview how your company policy calculates earnings, deductions, and net salary.
            </p>

            <FormField
              label="Sample Employee Monthly Wage (INR)"
              name="sampleWage"
              type="number"
              value={sampleWage}
              onChange={(e) => setSampleWage(e.target.value)}
            />

            {exceeds ? (
              <p className="text-xs font-semibold text-rose-600">
                ⚠ Warning: Non-balance components exceed monthly wage. Reduce percentages/amounts.
              </p>
            ) : null}

            {computedPreview.length > 0 ? (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-md border border-[var(--color-border)] text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--color-bg)] text-[var(--color-muted)] font-semibold">
                      <tr>
                        <th className="px-3 py-2">Component</th>
                        <th className="px-3 py-2">Policy Rule</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {computedPreview.map((c) => (
                        <tr key={c.name}>
                          <td className="px-3 py-2 font-medium">{c.name}</td>
                          <td className="px-3 py-2 text-[var(--color-muted)]">{c.ruleText}</td>
                          <td className={`px-3 py-2 text-right font-semibold tabular-nums ${c.amount < 0 ? "text-rose-600" : ""}`}>
                            {formatMoney(c.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[var(--color-bg)] font-semibold divide-y divide-[var(--color-border)]">
                      <tr>
                        <td className="px-3 py-2" colSpan={2}>Gross Monthly Earnings</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(W)}</td>
                      </tr>
                      <tr className="text-rose-600">
                        <td className="px-3 py-2" colSpan={2}>Employee Deductions (PF {pfEmpRate}% + PT)</td>
                        <td className="px-3 py-2 text-right tabular-nums">-{formatMoney(totalDeductions)}</td>
                      </tr>
                      <tr className="text-[var(--color-accent)]">
                        <td className="px-3 py-2" colSpan={2}>Employer Contribution (PF {pfErRate}%)</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(pfErAmt)}</td>
                      </tr>
                      <tr className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                        <td className="px-3 py-2.5" colSpan={2}>Estimated Net Take-Home Salary</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(netTakeHome)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}