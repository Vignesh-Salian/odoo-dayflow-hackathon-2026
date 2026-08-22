/**
 * OWNER: Prajwal (Person D) — shared shell nav + notification bell.
 */
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../features/auth/AuthContext.tsx";
import { notificationsApi } from "../api/notifications.ts";
import { Modal } from "./Modal.tsx";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm tracking-wide transition ${
    isActive ? "text-[var(--color-accent)]" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
  }`;

export function NavBar() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const companyName = user?.company?.name ?? "Dayflow";
  const isManager = user?.role === "ADMIN" || user?.role === "HR";
  const [bellOpen, setBellOpen] = useState(false);

  const notifQ = useQuery({
    queryKey: ["notifications"],
    enabled: !!user,
    queryFn: async () => (await notificationsApi.list({ limit: 20 })).data.data,
    refetchInterval: 60_000,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifQ.data?.unreadCount ?? 0;

  return (
    <>
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
              {isManager ? (
                <NavLink to="/timeoff/manage" className={linkClass}>
                  Approvals
                </NavLink>
              ) : null}
              <NavLink to="/payroll" className={linkClass}>
                Payroll
              </NavLink>
              {isManager ? (
                <NavLink to="/analytics" className={linkClass}>
                  Analytics
                </NavLink>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative rounded-md p-2 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
              aria-label="Notifications"
              onClick={() => setBellOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 3a6 6 0 0 0-6 6v2.2c0 .7-.2 1.4-.6 2L4 16h16l-1.4-2.8c-.4-.6-.6-1.3-.6-2V9a6 6 0 0 0-6-6Z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.75" />
              </svg>
              {unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
            >
              Check In
            </button>
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

      <Modal
        open={bellOpen}
        title="Notifications"
        onClose={() => setBellOpen(false)}
        wide
        footer={
          <button
            type="button"
            className="text-sm text-[var(--color-tab)] hover:underline"
            disabled={markAllMut.isPending || unread === 0}
            onClick={() => markAllMut.mutate()}
          >
            Mark all read
          </button>
        }
      >
        <ul className="divide-y divide-[var(--color-border)]">
          {(notifQ.data?.items ?? []).length === 0 ? (
            <li className="py-8 text-center text-sm text-[var(--color-muted)]">
              No notifications yet.
            </li>
          ) : (
            (notifQ.data?.items ?? []).map((n) => (
              <li key={n.id} className={`py-3 ${n.isRead ? "opacity-60" : ""}`}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    if (!n.isRead) markReadMut.mutate(n.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.isRead ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">{n.message}</p>
                  <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </Modal>
    </>
  );
}
