/** OWNER: Vignesh (Person C) — live presence status dot (§5.5). */
import type { PresenceStatus } from "../../api/attendance.ts";

const COLOR: Record<PresenceStatus, string> = {
  IN_OFFICE: "bg-[var(--color-success)]",
  CHECKED_OUT: "bg-emerald-700",
  ON_LEAVE: "bg-zinc-400",
  ABSENT: "bg-amber-400",
  NOT_CHECKED_IN: "bg-[var(--color-danger)]",
};

const LABEL: Record<PresenceStatus, string> = {
  IN_OFFICE: "In office",
  CHECKED_OUT: "Checked out",
  ON_LEAVE: "On leave",
  ABSENT: "Absent",
  NOT_CHECKED_IN: "Not checked in",
};

type Props = {
  status: PresenceStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
};

export function StatusDot({ status, size = "md", showLabel = false, className = "" }: Props) {
  const dim = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} title={LABEL[status]}>
      <span
        className={`${dim} shrink-0 rounded-full ${COLOR[status]} ring-2 ring-[var(--color-surface)]`}
        aria-label={LABEL[status]}
      />
      {showLabel ? <span className="text-sm text-[var(--color-muted)]">{LABEL[status]}</span> : null}
    </span>
  );
}
