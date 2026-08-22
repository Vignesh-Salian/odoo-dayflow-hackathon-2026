import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ComputationType } from "@prisma/client";
import {
  computeComponents,
  computeDeductions,
  defaultComponentTemplate,
  round2,
} from "./salaryEngine.js";

describe("salaryEngine (§5.3)", () => {
  it("sums exactly to monthly wage with BALANCE absorber", () => {
    const W = 50000;
    const computed = computeComponents(W, defaultComponentTemplate());
    const sum = round2(computed.reduce((s, c) => s + c.computedAmount, 0));
    assert.equal(sum, W);
    const balance = computed.find((c) => c.computationType === ComputationType.BALANCE);
    assert.ok(balance);
    assert.ok(balance!.computedAmount >= 0);
  });

  it("computes Basic as 50% of wage", () => {
    const computed = computeComponents(100000, defaultComponentTemplate());
    const basic = computed.find((c) => c.name === "Basic");
    assert.equal(basic?.computedAmount, 50000);
  });

  it("rejects configs that exceed wage", () => {
    assert.throws(() =>
      computeComponents(1000, [
        { name: "Basic", computationType: ComputationType.PERCENT_OF_WAGE, value: 50, sequence: 1 },
        {
          name: "Huge",
          computationType: ComputationType.FIXED_AMOUNT,
          value: 900,
          sequence: 2,
        },
        {
          name: "Fixed Allowance",
          computationType: ComputationType.BALANCE,
          value: null,
          sequence: 3,
        },
      ]),
    );
  });

  it("computes PF and professional tax deductions", () => {
    const d = computeDeductions({ basicAmount: 25000, pfEmployeeRate: 12, professionalTax: 200 });
    assert.equal(d.pfEmployee, 3000);
    assert.equal(d.professionalTax, 200);
    assert.equal(d.total, 3200);
  });
});
