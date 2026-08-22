/**
 * OWNER: Prajwal (Person D) — Phase 8
 * PLACEHOLDER on `main`. Copy from reference:
 *   git show reference/copy-from-here:frontend/src/components/NavBar.tsx > frontend/src/components/NavBar.tsx
 */
import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.tsx";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm ${isActive ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"}`;

export function NavBar() {
  const { user, logout } = useAuth();
  const isManager = user?.role === "ADMIN" || user?.role === "HR";

  return (
    <header className="border-b border-[var(--color-border)] px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <NavLink to={isManager ? "/employees" : "/me"} className="font-bold">
          {user?.company?.name ?? "Dayflow"}
        </NavLink>
        <nav className="flex flex-wrap gap-1 text-sm">
          {isManager ? <NavLink to="/employees" className={linkClass}>Employees</NavLink> : <NavLink to="/me" className={linkClass}>My Profile</NavLink>}
          <NavLink to="/attendance" className={linkClass}>Attendance</NavLink>
          <NavLink to="/timeoff" className={linkClass}>Time Off</NavLink>
          <NavLink to="/payroll" className={linkClass}>Payroll</NavLink>
          {user?.role === "ADMIN" ? <NavLink to="/settings" className={linkClass}>Logo</NavLink> : null}
          <button type="button" onClick={logout} className="px-3 text-[var(--color-danger)]">
            Log out
          </button>
        </nav>
      </div>
      <p className="mx-auto mt-1 max-w-6xl text-xs text-[var(--color-muted)]">
        TODO: copy full NavBar (logo + notifications) from reference/copy-from-here
      </p>
    </header>
  );
}
