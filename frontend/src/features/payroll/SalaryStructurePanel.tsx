/**
 * OWNER: Nidhish (Person B) — Phase 8
 * PLACEHOLDER on `main`. Copy from reference:
 *   git show reference/copy-from-here:frontend/src/features/payroll/SalaryStructurePanel.tsx > frontend/src/features/payroll/SalaryStructurePanel.tsx
 */
export type SalaryStructure = {
  id: string;
  monthlyWage: string | number;
  yearlyWage: string | number;
  workingDaysPerWeek: number;
  pfEmployeeRate: string | number;
  pfEmployerRate: string | number;
  professionalTax: string | number;
  effectiveFrom: string;
  components: Array<{
    id: string;
    name: string;
    computationType: string;
    value: string | number | null;
    computedAmount: string | number;
    sequence: number;
  }>;
};

export function SalaryStructurePanel(_props: {
  data?: SalaryStructure | null;
  isLoading?: boolean;
  readOnly?: boolean;
}) {
  return (
    <p className="text-sm text-[var(--color-muted)]">
      TODO: copy SalaryStructurePanel.tsx from branch <code>reference/copy-from-here</code>
    </p>
  );
}
