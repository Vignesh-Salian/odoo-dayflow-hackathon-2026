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

  it("calculates different salary breakdowns for Company A vs Company B policies for the same wage", () => {
    const W = 50000;

    // Company A Policy: Basic 50%, HRA 50% of Basic, PF 12%, PT 200
    const companyAPolicy = [
      { name: "Basic", computationType: ComputationType.PERCENT_OF_WAGE, value: 50, sequence: 1 },
      { name: "House Rent Allowance", computationType: ComputationType.PERCENT_OF_BASIC, value: 50, sequence: 2 },
      { name: "Standard Allowance", computationType: ComputationType.FIXED_AMOUNT, value: 4167, sequence: 3 },
      { name: "Performance Bonus", computationType: ComputationType.PERCENT_OF_BASIC, value: 8.333, sequence: 4 },
      { name: "Leave Travel Allowance", computationType: ComputationType.PERCENT_OF_BASIC, value: 8.333, sequence: 5 },
      { name: "Fixed Allowance", computationType: ComputationType.BALANCE, value: null, sequence: 6 },
    ];
    const compA = computeComponents(W, companyAPolicy);
    const basicA = compA.find((c) => c.name === "Basic")!.computedAmount;
    const hraA = compA.find((c) => c.name === "House Rent Allowance")!.computedAmount;
    const dedA = computeDeductions({ basicAmount: basicA, pfEmployeeRate: 12, professionalTax: 200 });

    assert.equal(basicA, 25000);
    assert.equal(hraA, 12500);
    assert.equal(dedA.total, 3200);
    assert.equal(W - dedA.total, 46800); // Net Salary Company A

    // Company B Policy: Basic 40%, HRA 30% of Basic, PF 10%, PT 150
    const companyBPolicy = [
      { name: "Basic", computationType: ComputationType.PERCENT_OF_WAGE, value: 40, sequence: 1 },
      { name: "House Rent Allowance", computationType: ComputationType.PERCENT_OF_BASIC, value: 30, sequence: 2 },
      { name: "Standard Allowance", computationType: ComputationType.FIXED_AMOUNT, value: 5000, sequence: 3 },
      { name: "Performance Bonus", computationType: ComputationType.PERCENT_OF_BASIC, value: 5, sequence: 4 },
      { name: "Leave Travel Allowance", computationType: ComputationType.PERCENT_OF_BASIC, value: 5, sequence: 5 },
      { name: "Fixed Allowance", computationType: ComputationType.BALANCE, value: null, sequence: 6 },
    ];
    const compB = computeComponents(W, companyBPolicy);
    const basicB = compB.find((c) => c.name === "Basic")!.computedAmount;
    const hraB = compB.find((c) => c.name === "House Rent Allowance")!.computedAmount;
    const dedB = computeDeductions({ basicAmount: basicB, pfEmployeeRate: 10, professionalTax: 150 });

    assert.equal(basicB, 20000);
    assert.equal(hraB, 6000);
    assert.equal(dedB.total, 2150);
    assert.equal(W - dedB.total, 47850); // Net Salary Company B

    // Verify Company A and Company B produce different Net Salaries
    assert.notEqual(basicA, basicB);
    assert.notEqual(hraA, hraB);
    assert.notEqual(dedA.total, dedB.total);
    assert.notEqual(W - dedA.total, W - dedB.total);
  });
});

