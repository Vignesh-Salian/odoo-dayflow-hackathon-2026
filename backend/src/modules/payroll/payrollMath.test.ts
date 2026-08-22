/**
 * OWNER: Nidhish (Person B) — Phase 7
 * Unit tests for payable-day / LOP maths (Build Plan §5.4).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Pure helpers mirrored from payroll rules — keep in sync with payroll.service */
export function computePayableDays(opts: {
  totalWorkingDays: number;
  unpaidLeaveDays: number;
  unauthorisedAbsentDays: number;
}) {
  const lop = opts.unpaidLeaveDays + opts.unauthorisedAbsentDays;
  const payable = Math.max(0, opts.totalWorkingDays - lop);
  return { lopDays: lop, payableDays: payable };
}

export function scaleEarnings(monthlyComponent: number, payableDays: number, totalWorkingDays: number) {
  if (totalWorkingDays <= 0) return 0;
  return Math.round((monthlyComponent * (payableDays / totalWorkingDays) + Number.EPSILON) * 100) / 100;
}

describe("payroll payable-day maths (§5.4)", () => {
  it("LOP = unpaid leave + unauthorised absent", () => {
    const r = computePayableDays({
      totalWorkingDays: 22,
      unpaidLeaveDays: 1,
      unauthorisedAbsentDays: 2,
    });
    assert.equal(r.lopDays, 3);
    assert.equal(r.payableDays, 19);
  });

  it("scales earnings by payable/total ratio", () => {
    assert.equal(scaleEarnings(50000, 20, 22), 45454.55);
  });
});
