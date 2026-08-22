/**
 * OWNER: Prajwal (Person D) — Phase 7 UI polish
 */
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="df-card flex flex-col items-center justify-center gap-3 border-dashed px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <Inbox className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-text)]">
        {title}
      </h2>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-[var(--color-muted)]">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="df-btn df-btn-primary mt-1">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
