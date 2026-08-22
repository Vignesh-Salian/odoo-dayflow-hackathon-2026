/**
 * OWNER: Nidhish (Person B) — salary structure panel matching PDF Salary Info layout.
 */
import { formatMoney } from "../../utils/format.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { LoadingState } from "../../components/LoadingState.tsx";

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
    "Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary.",
  "leave travel allowance":
    "LTA is paid by the company to employees to cover their travel expenses, and calculated as a % of the basic salary.",
  lta: "LTA is paid by the company to employees to cover their travel expenses, and calculated as a % of the basic salary.",
  "fixed allowance":
    "Fixed allowance portion of wages is determined after calculating all salary components (wage − other components).",
};

function num(v: string | number | null | undefined): number {
  if (v == null || v === "") return 0;
  return Number(v);
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
  return COMPONENT_BLURBS[key] ?? "Salary component derived from the monthly wage rules.";
}

type Props = {
  data?: SalaryStructure | null;
  isLoading?: boolean;
  readOnly?: boolean;
};

export function SalaryStructurePanel({ data, isLoading, readOnly = true }: Props) {
  if (isLoading) return <LoadingState label="Loading salary…" />;
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
  const basic =
    components.find((c) => c.name.toLowerCase() === "basic")?.computedAmount ?? 0;
  const basicAmt = num(basic);
  const pfEmpRate = num(data.pfEmployeeRate);
  const pfErRate = num(data.pfEmployerRate);
  const pfEmployeeAmt = Math.round(basicAmt * (pfEmpRate / 100) * 100) / 100;
  const pfEmployerAmt = Math.round(basicAmt * (pfErRate / 100) * 100) / 100;
  const pt = num(data.professionalTax);

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

      {/* Top: general wage info (PDF) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-[var(--color-muted)]">Month Wage</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatMoney(monthlyWage)} <span className="text-sm font-normal text-[var(--color-muted)]">/ Month</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Yearly wage</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatMoney(yearlyWage)}{" "}
            <span className="text-sm font-normal text-[var(--color-muted)]">/ Yearly</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">No. of working days in a week</p>
          <p className="text-xl font-semibold tabular-nums">{data.workingDaysPerWeek}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Break Time</p>
          <p className="text-xl font-semibold tabular-nums">
            {data.breakTimeHours != null && data.breakTimeHours !== ""
              ? String(data.breakTimeHours)
              : "—"}{" "}
            <span className="text-sm font-normal text-[var(--color-muted)]">/ hrs</span>
          </p>
        </div>
      </div>

      {/* Two columns: components | PF + tax */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-tab)]">Salary components</h3>
          {components.map((c) => {
            const amount = num(c.computedAmount);
            return (
              <div
                key={c.id}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{c.name}</p>
                  <p className="tabular-nums text-sm">
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
          <p className="border-t border-[var(--color-border)] pt-2 text-sm font-semibold tabular-nums">
            Total components: {formatMoney(monthlyWage)}
            <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">
              (must equal month wage)
            </span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-tab)]">
              Provident Fund (PF) Contribution
            </h3>
            <div className="space-y-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
              <div className="flex justify-between gap-2 text-sm">
                <span>Employee</span>
                <span className="tabular-nums">
                  <strong>{formatMoney(pfEmployeeAmt)}</strong>
                  <span className="text-[var(--color-muted)]"> / month · {pfEmpRate.toFixed(2)}%</span>
                </span>
              </div>
              <div className="flex justify-between gap-2 text-sm">
                <span>Employer</span>
                <span className="tabular-nums">
                  <strong>{formatMoney(pfEmployerAmt)}</strong>
                  <span className="text-[var(--color-muted)]"> / month · {pfErRate.toFixed(2)}%</span>
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                PF is calculated based on the basic salary.
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-tab)]">Tax Deductions</h3>
            <div className="space-y-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
              <div className="flex justify-between gap-2 text-sm">
                <span>Professional Tax</span>
                <span className="tabular-nums">
                  <strong>{formatMoney(pt)}</strong>
                  <span className="text-[var(--color-muted)]"> / month</span>
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Professional Tax deducted from the Gross salary.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
