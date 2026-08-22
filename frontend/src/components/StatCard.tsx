/**
 * OWNER: Prajwal (Person D)
 * Balance / metric tile for leave calendars.
 */
import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  icon?: ReactNode;
  trend?: { label: string; positive?: boolean };
};

export function StatCard({ label, value, hint, accent, icon, trend }: StatCardProps) {
  return (
    <div className="df-card relative overflow-hidden px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
      {accent ? (
        <span
          className="absolute inset-y-0 left-0 w-1 rounded-l-[var(--radius-card)]"
          style={{ background: accent }}
          aria-hidden
        />
      ) : null}
      <div className="flex items-start justify-between gap-2">
        {icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            {icon}
          </span>
        ) : (
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            {label}
          </p>
        )}
        {trend ? (
          <span
            className={`df-badge ${
              trend.positive
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
            }`}
          >
            {trend.label}
          </span>
        ) : null}
      </div>
      {icon ? (
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </p>
      ) : null}
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-[var(--color-muted)]">{hint}</p> : null}
    </div>
  );
}
