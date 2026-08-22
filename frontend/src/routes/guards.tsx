import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.tsx";
import type { AuthUser } from "../api/auth.ts";

/** Default landing path after login — employees never start on the HR directory. */
export function homePathFor(user: AuthUser | null | undefined): string {
  if (!user) return "/login";
  if (user.mustChangePassword) return "/change-password";
  if (user.role === "ADMIN" || user.role === "HR") return "/employees";
  return "/me";
}

export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homePathFor(user)} replace />;
}

export function RequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-muted)]">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}

export function GuestOnly() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-muted)]">
        Loading…
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  return <Outlet />;
}
