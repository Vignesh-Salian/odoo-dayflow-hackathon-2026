/**
 * OWNER: Prajwal (Person D) — Phase 7 UI polish
 */
import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-[var(--color-muted)]"
    >
      <LoaderCircle
        className="h-7 w-7 animate-spin text-[var(--color-accent)]"
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="animate-[soft-pulse_1.4s_ease-in-out_infinite] font-medium">{label}</span>
    </div>
  );
}
