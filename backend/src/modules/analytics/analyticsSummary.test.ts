/**
 * OWNER: Vignesh (Person C) — Phase 7
 * Analytics aggregate shape smoke test.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

export function buildDashboardSummary(input: {
  headcount: number;
  presentToday: number;
  pendingApprovals: number;
  monthlyPayrollCost: number;
}) {
  return {
    ...input,
    attendancePct:
      input.headcount === 0 ? 0 : Math.round((input.presentToday / input.headcount) * 1000) / 10,
  };
}

describe("analytics dashboard summary", () => {
  it("computes attendance percentage", () => {
    const s = buildDashboardSummary({
      headcount: 10,
      presentToday: 8,
      pendingApprovals: 2,
      monthlyPayrollCost: 500000,
    });
    assert.equal(s.attendancePct, 80);
  });
});
