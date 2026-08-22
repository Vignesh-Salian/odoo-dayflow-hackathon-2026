/**
 * OWNER: Nidhish (Person B) — Phase 8
 * PLACEHOLDER on `main`. Copy from reference:
 *   git show reference/copy-from-here:frontend/src/features/employees/EmployeesPage.tsx > frontend/src/features/employees/EmployeesPage.tsx
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";

export function EmployeesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "HR";
  if (!canManage) return <Navigate to="/me" replace />;
  return (
    <section className="space-y-3 p-4">
      <h1 className="text-2xl font-bold">Employees</h1>
      <p className="text-sm text-[var(--color-muted)]">
        TODO: copy <code>EmployeesPage.tsx</code> from <code>reference/copy-from-here</code>
      </p>
    </section>
  );
}
