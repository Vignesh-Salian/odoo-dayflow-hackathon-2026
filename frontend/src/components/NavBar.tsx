/**
 * OWNER: Prajwal (Person D) — app shell: sidebar + top bar.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  LogOut,
  Menu,
  Moon,
  ScrollText,
  Settings,
  Sun,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext.tsx";
import { useTheme } from "../features/theme/ThemeContext.tsx";
import { notificationsApi } from "../api/notifications.ts";
import { attendanceApi } from "../api/attendance.ts";
import { Modal } from "./Modal.tsx";
import { mediaUrl } from "../utils/format.ts";
import { todayKey as appTodayKey, todayMonthYear } from "../utils/today.ts";

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
};

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
    isActive
      ? "bg-[var(--color-sidebar-active)] !text-white shadow-sm"
      : "text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-text)]",
  ].join(" ");
}

export function NavBar({
  mobileOpen,
  onMobileClose,
  onMobileOpen,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onMobileOpen: () => void;
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const qc = useQueryClient();
  const companyName = user?.company?.name ?? "Dayflow";
  const logoSrc = mediaUrl(user?.company?.logoUrl ?? null);
  const isManager = user?.role === "ADMIN" || user?.role === "HR";
  const isAdmin = user?.role === "ADMIN";
  const [bellOpen, setBellOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    onMobileClose();
  }, [location.pathname, onMobileClose]);

  const notifQ = useQuery({
    queryKey: ["notifications", user?.companyId, user?.id],
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

  const now = todayMonthYear();
  const presenceQ = useQuery({
    queryKey: ["attendance", "me", now.month, now.year],
    enabled: !!user,
    queryFn: async () =>
      (await attendanceApi.me(now.month, now.year)).data.data,
    refetchInterval: 60_000,
  });
  const todayKey = appTodayKey();
  const todayRec = presenceQ.data?.records.find((r) => r.date === todayKey);
  const inOffice = !!todayRec?.checkIn && !todayRec?.checkOut;

  const primaryNav: NavItem[] = useMemo(() => {
    const items: NavItem[] = [];
    if (isManager) {
      items.push({
        to: "/employees",
        label: "Employees",
        icon: <Users className="h-4.5 w-4.5" strokeWidth={1.75} />,
      });
    } else {
      items.push({
        to: "/me",
        label: "My Profile",
        icon: <UserRound className="h-4.5 w-4.5" strokeWidth={1.75} />,
      });
    }
    items.push({
      to: "/attendance",
      label: "Attendance",
      icon: <ClipboardCheck className="h-4.5 w-4.5" strokeWidth={1.75} />,
      end: true,
    });
    if (isManager) {
      items.push({
        to: "/attendance/all",
        label: "All attendance",
        icon: <ClipboardList className="h-4.5 w-4.5" strokeWidth={1.75} />,
      });
    }
    items.push({
      to: "/timeoff",
      label: "Time Off",
      icon: <CalendarDays className="h-4.5 w-4.5" strokeWidth={1.75} />,
      end: true,
    });
    if (isManager) {
      items.push({
        to: "/timeoff/manage",
        label: "Approvals",
        icon: <ClipboardList className="h-4.5 w-4.5" strokeWidth={1.75} />,
      });
    }
    items.push({
      to: "/payroll",
      label: "Payroll",
      icon: <ScrollText className="h-4.5 w-4.5" strokeWidth={1.75} />,
    });
    if (isManager) {
      items.push({
        to: "/analytics",
        label: "Analytics",
        icon: <ChartColumn className="h-4.5 w-4.5" strokeWidth={1.75} />,
      });
    }
    return items;
  }, [isManager]);

  const firstName = user?.firstName ?? user?.email?.split("@")[0] ?? "there";

  const sidebar = (
    <aside className="flex h-full w-[15.5rem] flex-col border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] text-[var(--color-sidebar-text)] shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <NavLink
          to={isManager ? "/employees" : "/me"}
          className="flex min-w-0 items-center gap-2.5"
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              className="h-9 w-9 shrink-0 rounded-xl object-contain ring-1 ring-[var(--color-sidebar-border)]"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-sidebar-active)] text-sm font-bold text-white">
              {companyName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="truncate font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            {companyName}
          </span>
        </NavLink>
        <button
          type="button"
          className="ml-auto rounded-lg p-1.5 text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] lg:hidden"
          aria-label="Close menu"
          onClick={onMobileClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-sidebar-muted)]">
          Menu
        </p>
        {primaryNav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
            <span className="opacity-90">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t border-[var(--color-sidebar-border)] p-3">
        <NavLink
          to="/attendance"
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-sidebar-active)] px-3 py-2.5 text-sm font-semibold !text-white transition hover:brightness-110"
        >
          Check In
        </NavLink>
        {isAdmin ? (
          <div className="space-y-0.5">
            <NavLink to="/salary-policy" className={navClass}>
              <Wallet className="h-4.5 w-4.5" strokeWidth={1.75} />
              Salary Policy
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              <Settings className="h-4.5 w-4.5" strokeWidth={1.75} />
              Settings
            </NavLink>
            <NavLink to="/audit" className={navClass}>
              <ScrollText className="h-4.5 w-4.5" strokeWidth={1.75} />
              Audit log
            </NavLink>
          </div>
        ) : null}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={onMobileClose}
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl animate-[fade-up_200ms_ease-out]">
            {sidebar}
          </div>
        </div>
      ) : null}

      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_78%,transparent)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-muted)] transition hover:text-[var(--color-text)] lg:hidden"
              aria-label="Open menu"
              onClick={onMobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate font-[family-name:var(--font-display)] text-base font-semibold sm:text-lg">
                Hello {firstName}
              </p>
              <p className="hidden truncate text-xs text-[var(--color-muted)] sm:block">
                Let&apos;s get you going
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
              aria-label="Notifications"
              onClick={() => setBellOpen(true)}
            >
              <Bell className="h-4.5 w-4.5" strokeWidth={1.75} />
              {unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-text)] sm:px-3"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to night mode"}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 text-[var(--color-warning)]" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Light mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Night mode</span>
                </>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1 pl-1 pr-2.5 transition hover:border-[var(--color-accent)]/40"
                aria-label="Account menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((o) => !o)}
              >
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-bold text-[var(--color-accent)]">
                  {(user?.firstName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--color-surface)] ${
                      inOffice ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]"
                    }`}
                    title={inOffice ? "Checked in" : "Not checked in"}
                  />
                </span>
                <span className="hidden max-w-[7rem] truncate text-left text-xs leading-tight sm:block">
                  <span className="block font-semibold text-[var(--color-text)]">
                    {user?.firstName ?? "Account"}
                  </span>
                  <span className="block truncate text-[var(--color-muted)]">{user?.email}</span>
                </span>
              </button>

              {accountOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close account menu"
                    onClick={() => setAccountOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 animate-[fade-up_160ms_ease-out] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 shadow-[var(--shadow-card)]">
                    <NavLink
                      to="/me"
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-surface-2)]"
                      onClick={() => setAccountOpen(false)}
                    >
                      <UserRound className="h-4 w-4 text-[var(--color-muted)]" />
                      My Profile
                    </NavLink>
                    {isAdmin ? (
                      <>
                        <NavLink
                          to="/settings"
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-surface-2)]"
                          onClick={() => setAccountOpen(false)}
                        >
                          <Settings className="h-4 w-4 text-[var(--color-muted)]" />
                          Company logo
                        </NavLink>
                        <NavLink
                          to="/audit"
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-surface-2)]"
                          onClick={() => setAccountOpen(false)}
                        >
                          <ScrollText className="h-4 w-4 text-[var(--color-muted)]" />
                          Audit log
                        </NavLink>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface-2)]"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                </>
              ) : null}
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
            className="text-sm font-medium text-[var(--color-tab)] hover:underline disabled:opacity-50"
            disabled={markAllMut.isPending || unread === 0}
            onClick={() => markAllMut.mutate()}
          >
            Mark all read
          </button>
        }
      >
        <ul className="divide-y divide-[var(--color-border)]">
          {(notifQ.data?.items ?? []).length === 0 ? (
            <li className="py-10 text-center text-sm text-[var(--color-muted)]">
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
