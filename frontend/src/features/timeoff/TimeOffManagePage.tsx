/**
 * OWNER: Prajwal (Person D) — Phase 8
 * PLACEHOLDER on `main`. Copy from reference:
 *   git show reference/copy-from-here:frontend/src/features/timeoff/TimeOffManagePage.tsx > frontend/src/features/timeoff/TimeOffManagePage.tsx
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";

export function TimeOffManagePage() {
  const { user } = useAuth();
  if (user?.role !== "ADMIN" && user?.role !== "HR") {
    return <Navigate to="/timeoff" replace />;
  }
  return (
    <section className="space-y-3 p-4">
      <h1 className="text-2xl font-bold">Manage Time Off</h1>
      <p className="text-sm text-[var(--color-muted)]">
        TODO: copy <code>TimeOffManagePage.tsx</code> from <code>reference/copy-from-here</code>
      </p>
    </section>
  );
}
