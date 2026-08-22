import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar.tsx";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);

  return (
    <div className="min-h-screen">
      <NavBar
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
        onMobileOpen={openMobile}
      />
      <main className="lg:pl-[15.5rem]">
        <div className="mx-auto max-w-6xl animate-fade-up px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
