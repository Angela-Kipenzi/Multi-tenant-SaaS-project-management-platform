import type{ ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

interface AppShellProps {
  children: ReactNode;
  crumbs?: { label: string; to?: string }[];
}

export const AppShell = ({ children, crumbs }: AppShellProps) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar crumbs={crumbs} />
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};