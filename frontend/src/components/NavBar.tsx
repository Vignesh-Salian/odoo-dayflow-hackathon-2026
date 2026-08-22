/**
 * OWNER: Prajwal (Person D) — polish + notification bell.
 * COPY FROM BRANCH: reference/copy-from-here → frontend/src/components/NavBar.tsx
 *
 * Minimal shell kept on main so auth works. Paste the full NavBar from reference.
 */
import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.tsx";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm tracking-wide transition ${
    isActive ? "text-[var(--color-accent)]" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
  }`;

export function NavBar() {
  const { user, logout } = useAuth();
  const companyName = user?.company?.name ?? "Dayflow";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_86%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <NavLink
            to="/employees"
            className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight"
          >
            {companyName}
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/employees" className={linkClass}>
              Employees
            </NavLink>
            <NavLink to="/attendance" className={linkClass}>
              Attendance
            </NavLink>
            <NavLink to="/timeoff" className={linkClass}>
              Time Off
            </NavLink>
            <NavLink to="/payroll" className={linkClass}>
              Payroll
            </NavLink>
            {(user?.role === "ADMIN" || user?.role === "HR") && (
              <NavLink to="/analytics" className={linkClass}>
                Analytics
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="group relative">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-sm font-semibold"
              aria-label="Account menu"
            >
              {(user?.firstName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
            </button>
            <div className="invisible absolute right-0 top-full z-50 mt-2 w-44 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <NavLink to="/me" className="block px-3 py-2 text-sm hover:bg-[var(--color-surface-2)]">
                My Profile
              </NavLink>
              <button
                type="button"
                onClick={logout}
                className="block w-full px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface-2)]"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
