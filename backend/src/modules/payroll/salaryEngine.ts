/** OWNER: Nidhish (Person B) */
import { ComputationType } from "@prisma/client";
import { AppError } from "../../common/errors/AppError.js";

export type ComponentInput = {
  name: string;
  computationType: ComputationType;
  value: number | null;
  sequence: number;
};

export type ComputedComponent = ComponentInput & {
  computedAmount: number;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Salary component engine per Build Plan §5.3.
 * BALANCE (Fixed Allowance) absorbs remainder so Σ amounts === W exactly.
 */
export function computeComponents(
  monthlyWage: number,
  components: ComponentInput[],
): ComputedComponent[] {
  const W = round2(monthlyWage);
  if (W < 0) {
    throw new AppError(400, "INVALID_WAGE", "Monthly wage cannot be negative", {
      monthlyWage: "Must be >= 0",
    });
  }

  const ordered = [...components].sort((a, b) => a.sequence - b.sequence);
  const balanceComponents = ordered.filter(
    (component) => component.computationType === ComputationType.BALANCE,
  );
  if (balanceComponents.length !== 1) {
    throw new AppError(
      400,
      "INVALID_BALANCE",
      "Salary structure must include exactly one BALANCE component",
    );
  }

  const nonBalance = ordered.filter((c) => c.computationType !== ComputationType.BALANCE);
  const balanceComp = balanceComponents[0]!;

  let basic = 0;
  let running = 0;
  const computed: ComputedComponent[] = [];

  for (const c of nonBalance) {
    let amount = 0;
    if (c.computationType === ComputationType.PERCENT_OF_WAGE) {
      amount = round2(W * (Number(c.value ?? 0) / 100));
    } else if (c.computationType === ComputationType.PERCENT_OF_BASIC) {
      amount = round2(basic * (Number(c.value ?? 0) / 100));
    } else if (c.computationType === ComputationType.FIXED_AMOUNT) {
      amount = round2(Number(c.value ?? 0));
    }

    if (amount < 0) {
      throw new AppError(400, "NEGATIVE_COMPONENT", `Component "${c.name}" cannot be negative`);
    }

    if (c.name.toLowerCase() === "basic") {
      basic = amount;
    }

    running = round2(running + amount);
    computed.push({ ...c, computedAmount: amount });
  }

  if (running > W) {
    throw new AppError(
      400,
      "COMPONENTS_EXCEED_WAGE",
      "Sum of non-balance components exceeds monthly wage",
      { components: `Running total ${running} > wage ${W}` },
    );
  }

  const balanceAmount = round2(W - running);
  if (balanceAmount < 0) {
    throw new AppError(400, "NEGATIVE_BALANCE", "Balance component would be negative");
  }

  computed.push({ ...balanceComp, computedAmount: balanceAmount, value: null });
  computed.sort((a, b) => a.sequence - b.sequence);

  const sum = round2(computed.reduce((s, c) => s + c.computedAmount, 0));
  if (sum !== W) {
    // Fix floating drift on last balance
    const last = computed.find((c) => c.computationType === ComputationType.BALANCE);
    if (last) {
      last.computedAmount = round2(last.computedAmount + (W - sum));
    }
  }

  return computed;
}

/** Default component template seeded when creating a new salary structure */
export function defaultComponentTemplate(): ComponentInput[] {
  return [
    { name: "Basic", computationType: ComputationType.PERCENT_OF_WAGE, value: 50, sequence: 1 },
    {
      name: "House Rent Allowance",
      computationType: ComputationType.PERCENT_OF_BASIC,
      value: 50,
      sequence: 2,
    },
    {
      name: "Standard Allowance",
      computationType: ComputationType.FIXED_AMOUNT,
      value: 4167,
      sequence: 3,
    },
    {
      name: "Performance Bonus",
      computationType: ComputationType.PERCENT_OF_BASIC,
      value: 8.333,
      sequence: 4,
    },
    {
      name: "Leave Travel Allowance",
      computationType: ComputationType.PERCENT_OF_BASIC,
      value: 8.333,
      sequence: 5,
    },
    {
      name: "Fixed Allowance",
      computationType: ComputationType.BALANCE,
      value: null,
      sequence: 6,
    },
  ];
}

export function computeDeductions(opts: {
  basicAmount: number;
  pfEmployeeRate: number;
  professionalTax: number;
}): { pfEmployee: number; professionalTax: number; total: number } {
  const pfEmployee = round2(opts.basicAmount * (opts.pfEmployeeRate / 100));
  const professionalTax = round2(opts.professionalTax);
  return {
    pfEmployee,
    professionalTax,
    total: round2(pfEmployee + professionalTax),
  };
}

export { round2 };
