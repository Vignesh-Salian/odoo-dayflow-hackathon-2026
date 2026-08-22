/**
 * OWNER: Nidhish (Person B) — salary structure read-only panel.
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
  pfEmployeeRate: string | number;
  pfEmployerRate: string | number;
  professionalTax: string | number;
  effectiveFrom: string;
  isActive: boolean;
  components: SalaryComponent[];
};

function computationLabel(type: string, value: string | number | null) {
  switch (type) {
    case "PERCENT_OF_WAGE":
      return `${value}% of wage`;
    case "PERCENT_OF_BASIC":
      return `${value}% of basic`;
    case "FIXED":
      return `Fixed ${formatMoney(value)}`;
    case "BALANCE":
      return "Balance (fills to wage)";
    default:
      return type;
  }
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

  const components = [...(data.components ?? [])].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="space-y-4">
      {readOnly ? (
        <p className="text-xs text-[var(--color-muted)]">Read-only for your role.</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
          <p className="text-xs text-[var(--color-muted)]">Monthly wage</p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(data.monthlyWage)}</p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
          <p className="text-xs text-[var(--color-muted)]">Yearly wage</p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(data.yearlyWage)}</p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
          <p className="text-xs text-[var(--color-muted)]">Working days / week</p>
          <p className="text-lg font-semibold tabular-nums">{data.workingDaysPerWeek}</p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
          <p className="text-xs text-[var(--color-muted)]">Effective from</p>
          <p className="text-lg font-semibold">
            {new Date(data.effectiveFrom).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="bg-[var(--color-bg)] text-[var(--color-muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Component</th>
              <th className="px-3 py-2 font-medium">Rule</th>
              <th className="px-3 py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c) => (
              <tr key={c.id} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2 text-[var(--color-muted)]">
                  {computationLabel(c.computationType, c.value)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatMoney(c.computedAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
              <td className="px-3 py-2 font-semibold" colSpan={2}>
                Total (must equal monthly wage)
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {formatMoney(data.monthlyWage)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
        <span>
          PF employee: <strong className="text-[var(--color-text)]">{data.pfEmployeeRate}%</strong>
        </span>
        <span>
          PF employer: <strong className="text-[var(--color-text)]">{data.pfEmployerRate}%</strong>
        </span>
        <span>
          Professional tax:{" "}
          <strong className="text-[var(--color-text)]">{formatMoney(data.professionalTax)}</strong>
        </span>
      </div>
    </div>
  );
}
