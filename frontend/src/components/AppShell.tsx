import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export interface Crumb {
  label: string;
  to?: string;
}

interface AppShellProps {
  children: ReactNode;
  crumbs?: Crumb[];
}

export const AppShell = ({ children, crumbs }: AppShellProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <TopBar
        crumbs={crumbs}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};