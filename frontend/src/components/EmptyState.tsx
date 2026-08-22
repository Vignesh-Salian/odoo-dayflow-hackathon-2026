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
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center transition-colors">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-text)]">{title}</h2>
      {description ? <p className="max-w-md text-sm text-[var(--color-muted)] leading-relaxed">{description}</p> : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex items-center justify-center rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
