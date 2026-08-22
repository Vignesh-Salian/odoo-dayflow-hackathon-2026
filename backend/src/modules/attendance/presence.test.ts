/**
 * OWNER: Vignesh (Person C) — Phase 7
 * Presence status rules (Build Plan §5.5).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

export type PresenceStatus = "IN_OFFICE" | "CHECKED_OUT" | "ON_LEAVE" | "ABSENT" | "NOT_CHECKED_IN";

export function computePresence(opts: {
  isWorkingDay: boolean;
  onApprovedLeave: boolean;
  hasCheckIn: boolean;
  hasCheckOut: boolean;
}): PresenceStatus {
  if (opts.onApprovedLeave) return "ON_LEAVE";
  if (!opts.isWorkingDay) return "CHECKED_OUT";
  if (opts.hasCheckIn && !opts.hasCheckOut) return "IN_OFFICE";
  if (opts.hasCheckIn && opts.hasCheckOut) return "CHECKED_OUT";
  return "ABSENT";
}

describe("presence status (§5.5)", () => {
  it("green / in-office when checked in and not out", () => {
    assert.equal(
      computePresence({
        isWorkingDay: true,
        onApprovedLeave: false,
        hasCheckIn: true,
        hasCheckOut: false,
      }),
      "IN_OFFICE",
    );
  });

  it("grey / on-leave when approved leave covers today", () => {
    assert.equal(
      computePresence({
        isWorkingDay: true,
        onApprovedLeave: true,
        hasCheckIn: false,
        hasCheckOut: false,
      }),
      "ON_LEAVE",
    );
  });

  it("yellow / absent when working day with no check-in", () => {
    assert.equal(
      computePresence({
        isWorkingDay: true,
        onApprovedLeave: false,
        hasCheckIn: false,
        hasCheckOut: false,
      }),
      "ABSENT",
    );
  });
});
