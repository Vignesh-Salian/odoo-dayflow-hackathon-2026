/**
 * OWNER: Prajwal (Person D) — Phase 7 UI polish
 *
 * PLACEHOLDER on `main`. Copy the full file from `reference/copy-from-here`:
 *   git show reference/copy-from-here:frontend/src/components/EmptyState.tsx > frontend/src/components/EmptyState.tsx
 */
type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** TODO: copy full EmptyState from reference/copy-from-here */
export function EmptyState({ title }: EmptyStateProps) {
  return <div data-placeholder="EmptyState">{title}</div>;
}
