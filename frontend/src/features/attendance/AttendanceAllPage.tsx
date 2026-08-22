/**
 * OWNER: Vignesh (Person C) — Phase 8
 * PLACEHOLDER on `main`. Copy from reference:
 *   git show reference/copy-from-here:frontend/src/features/attendance/AttendanceAllPage.tsx > frontend/src/features/attendance/AttendanceAllPage.tsx
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";

export function AttendanceAllPage() {
  const { user } = useAuth();
  if (user?.role !== "ADMIN" && user?.role !== "HR") {
    return <Navigate to="/attendance" replace />;
  }
  return (
    <section className="space-y-3 p-4">
      <h1 className="text-2xl font-bold">Attendance — all</h1>
      <p className="text-sm text-[var(--color-muted)]">
        TODO: copy <code>AttendanceAllPage.tsx</code> from <code>reference/copy-from-here</code>
      </p>
    </section>
  );
}
