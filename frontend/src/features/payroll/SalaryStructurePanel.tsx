/**
 * OWNER: Nidhish (Person B) — salary structure panel matching PDF Salary Info layout.
 */
import { formatMoney } from "../../utils/format.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { LoadingState } from "../../components/LoadingState.tsx";
import { StatCard } from "../../components/StatCard.tsx";

export type SalaryComponent = {
  id: string;
  name: string;
  computationType: string;
  value: string | number | null;
  computedAmount: string | number;
  sequence: number;
};

export type SalaryStructure = {
  id: string;
  wageType: string;
  monthlyWage: string | number;
  yearlyWage: string | number;
  workingDaysPerWeek: number;
  breakTimeHours?: string | number | null;
  pfEmployeeRate: string | number;
  pfEmployerRate: string | number;
  professionalTax: string | number;
  effectiveFrom: string;
  isActive: boolean;
  components: SalaryComponent[];
};

const COMPONENT_BLURBS: Record<string, string> = {
  basic: "Define Basic salary from company cost; compute is based on monthly wages.",
  "house rent allowance": "HRA provided to employees as a % of the basic salary.",
  hra: "HRA provided to employees as a % of the basic salary.",
  "standard allowance":
    "A standard allowance is a predetermined, fixed amount provided to employee as part of their salary.",
  "performance bonus":
    "Variable amount paid during payroll. Calculated as a % of the basic salary.",
  "leave travel allowance":
    "LTA is paid by the company to employees to cover travel expenses, calculated as a % of the basic salary.",
  lta: "LTA is paid by the company to employees to cover travel expenses, calculated as a % of the basic salary.",
  "fixed allowance":
    "Fixed allowance portion of wages is determined after calculating all salary components (wage - others).",
};

function num(v: string | number | null | undefined): number {
  if (v == null || v === "") return 0;
  return Number(v);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function percentBadge(type: string, value: string | number | null, monthlyWage: number, amount: number) {
  if (type === "BALANCE") {
    const pct = monthlyWage > 0 ? ((amount / monthlyWage) * 100).toFixed(2) : "0.00";
    return `${pct}%`;
  }
  if (type === "PERCENT_OF_WAGE" || type === "PERCENT_OF_BASIC") {
    return `${Number(value ?? 0).toFixed(2)}%`;
  }
  if (type === "FIXED_AMOUNT" || type === "FIXED") {
    const pct = monthlyWage > 0 ? ((amount / monthlyWage) * 100).toFixed(2) : "0.00";
    return `${pct}%`;
  }
  return "—";
}

function blurbFor(name: string): string {
  const key = name.toLowerCase().trim();
  return COMPONENT_BLURBS[key] ?? "Salary component derived from monthly wage rules.";
}

type Props = {
  data?: SalaryStructure | null;
  isLoading?: boolean;
  readOnly?: boolean;
};

export function SalaryStructurePanel({ data, isLoading, readOnly = true }: Props) {
  if (isLoading) return <LoadingState label="Loading salary structure…" />;
  if (!data) {
    return (
      <EmptyState
        title="No salary structure"
        description="Admin has not set an active salary structure for this employee yet."
      />
    );
  }

  const monthlyWage = num(data.monthlyWage);
  const yearlyWage = num(data.yearlyWage) || monthlyWage * 12;
  const components = [...(data.components ?? [])].sort((a, b) => a.sequence - b.sequence);
  const basic = components.find((c) => c.name.toLowerCase() === "basic")?.computedAmount ?? 0;
  const basicAmt = num(basic);
  const pfEmpRate = num(data.pfEmployeeRate);
  const pfErRate = num(data.pfEmployerRate);
  const pfEmployeeAmt = round2(basicAmt * (pfEmpRate / 100));
  const pfEmployerAmt = round2(basicAmt * (pfErRate / 100));
  const pt = num(data.professionalTax);
  const totalDeductions = round2(pfEmployeeAmt + pt);
  const netSalary = round2(monthlyWage - totalDeductions);

  return (
    <div className="space-y-6">
      {readOnly ? (
        <p className="text-xs text-[var(--color-muted)]">
          Fixed wage · components auto-sum to monthly wage · read-only for your role
        </p>
      ) : (
        <p className="text-xs text-[var(--color-muted)]">
          Wage type: Fixed wage · changing the wage recalculates all components
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Monthly wage" value={formatMoney(monthlyWage)} hint="/ month" />
        <StatCard label="Yearly wage" value={formatMoney(yearlyWage)} hint="/ year" />
        <StatCard label="Working days / week" value={`${data.workingDaysPerWeek} days`} />
        <StatCard
          label="Break time"
          value={
            data.breakTimeHours != null && data.breakTimeHours !== ""
              ? String(data.breakTimeHours)
              : "—"
          }
          hint="/ hrs"
        />
      </div>

      <div className="df-card space-y-3 p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Salary summary</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
            <p className="text-xs font-medium text-[var(--color-muted)]">Gross earnings</p>
            <p className="text-lg font-bold tabular-nums">{formatMoney(monthlyWage)}</p>
            <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">Basic + allowances</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
            <p className="text-xs font-medium text-[var(--color-muted)]">Employee deductions</p>
            <p className="text-lg font-bold tabular-nums text-[var(--color-danger)]">
              -{formatMoney(totalDeductions)}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
              PF ({pfEmpRate}%) + PT ({formatMoney(pt)})
            </p>
          </div>
          <div className="rounded-xl border border-emerald-300/50 bg-emerald-500/10 p-3 dark:border-emerald-800">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Net take-home
            </p>
            <p className="text-xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
              {formatMoney(netSalary)}
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              Gross − employee deductions
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
            <p className="text-xs font-medium text-[var(--color-muted)]">Employer contributions</p>
            <p className="text-lg font-bold tabular-nums text-[var(--color-accent)]">
              {formatMoney(pfEmployerAmt)}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">Employer PF ({pfErRate}%)</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Earnings components</h3>
          {components.map((c) => {
            const amount = num(c.computedAmount);
            return (
              <div
                key={c.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm tabular-nums">
                    <span className="font-semibold">{formatMoney(amount)}</span>
                    <span className="text-[var(--color-muted)]"> / month</span>
                    <span className="ml-2 text-[var(--color-muted)]">
                      {percentBadge(c.computationType, c.value, monthlyWage, amount)}
                    </span>
                  </p>
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{blurbFor(c.name)}</p>
              </div>
            );
          })}
          <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2 text-sm font-semibold">
            <span>Total gross components</span>
            <span className="tabular-nums">{formatMoney(monthlyWage)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
              Provident Fund (PF)
            </h3>
            <div className="df-card space-y-2 p-3">
              <div className="flex justify-between gap-2 text-sm">
                <span className="font-medium">Employee PF ({pfEmpRate}%)</span>
                <span className="tabular-nums">
                  <strong className="text-[var(--color-danger)]">-{formatMoney(pfEmployeeAmt)}</strong>
                  <span className="text-[var(--color-muted)]"> / month</span>
                </span>
              </div>
              <div className="flex justify-between gap-2 border-t border-[var(--color-border)] pt-1 text-sm">
                <span className="font-medium">Employer PF ({pfErRate}%)</span>
                <span className="tabular-nums">
                  <strong className="text-[var(--color-accent)]">{formatMoney(pfEmployerAmt)}</strong>
                  <span className="text-[var(--color-muted)]"> / month</span>
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                PF is calculated on Basic ({formatMoney(basicAmt)}). Employer PF is company-paid and
                does not reduce employee net salary.
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Tax deductions</h3>
            <div className="df-card space-y-2 p-3">
              <div className="flex justify-between gap-2 text-sm">
                <span className="font-medium">Professional Tax (PT)</span>
                <span className="tabular-nums">
                  <strong className="text-[var(--color-danger)]">-{formatMoney(pt)}</strong>
                  <span className="text-[var(--color-muted)]"> / month</span>
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Professional Tax deducted directly from gross salary.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
