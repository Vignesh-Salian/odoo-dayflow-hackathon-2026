/**
 * OWNER: Prajwal (Person D) — Phase 7 UI polish
 */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--color-muted)]">
      <span className="animate-pulse">{label}</span>
    </div>
  );
}
