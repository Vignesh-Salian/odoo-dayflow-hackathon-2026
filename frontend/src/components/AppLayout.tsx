import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar.tsx";

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
