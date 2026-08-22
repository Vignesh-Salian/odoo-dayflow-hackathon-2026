import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { companyCodeFromName } from "../../common/utils/security.js";

describe("companyCodeFromName (§5.1 helper)", () => {
  it("derives OI from Odoo India", () => {
    assert.equal(companyCodeFromName("Odoo India"), "OI");
  });

  it("pads short single-word names", () => {
    assert.equal(companyCodeFromName("X"), "XX");
  });
});
