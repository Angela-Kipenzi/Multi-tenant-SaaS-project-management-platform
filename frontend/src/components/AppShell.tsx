import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { workspace, role, clear } = useWorkspaceStore();

  const onLogout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch {
      /* ignore */
    }
    clearAuth();
    clear();
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/projects" className="text-sm font-semibold text-slate-900">
              SaaS PM
            </Link>
            {workspace && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">{workspace.name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                  {role}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/billing"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Billing
            </Link>
            <span className="text-sm text-slate-500">{user?.email}</span>
            <Button variant="ghost" onClick={onLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
      </main>
    </div>
  );
};