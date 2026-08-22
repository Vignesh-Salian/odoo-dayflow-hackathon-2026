/**
 * OWNER: Prajwal (Person D)
 * Balance / metric tile for leave calendars.
 */
type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
};

export function StatCard({ label, value, hint, accent }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5">
      {accent ? (
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: accent }}
          aria-hidden
        />
      ) : null}
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-[var(--color-muted)]">{hint}</p> : null}
    </div>
  );
}
