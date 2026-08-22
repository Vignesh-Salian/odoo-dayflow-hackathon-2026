/**
 * OWNER: Prajwal (Person D) — Phase 7 UI polish
 */
type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">{title}</h2>
      {description ? <p className="max-w-md text-sm text-[var(--color-muted)]">{description}</p> : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
