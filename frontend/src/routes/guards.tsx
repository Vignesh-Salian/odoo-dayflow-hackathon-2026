import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
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

function AuthBoot() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-[var(--color-muted)]">
      <LoaderCircle className="h-7 w-7 animate-spin text-[var(--color-accent)]" strokeWidth={1.75} />
      Loading…
    </div>
  );
}

export function RequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthBoot />;

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

  if (isLoading) return <AuthBoot />;

  if (isAuthenticated) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  return <Outlet />;
}
