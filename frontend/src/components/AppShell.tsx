import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { listMyMemberships } from "@/services/workspaces";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { workspace, role, setWorkspace, clear } = useWorkspaceStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: memberships } = useQuery({
    queryKey: ["memberships"],
    queryFn: listMyMemberships,
    enabled: !!user,
  });

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const switchWorkspace = (m: { workspace: any; role: any }) => {
    setWorkspace(m.workspace, m.role);
    queryClient.invalidateQueries();
    setMenuOpen(false);
    navigate("/projects");
  };

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
            {workspace && memberships && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <span>{workspace.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                    {role}
                  </span>
                  <svg
                    className="h-3 w-3 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {menuOpen && memberships.length > 1 && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                    {memberships.map((m) => (
                      <button
                        key={m.membership_id}
                        onClick={() => switchWorkspace(m)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                          m.workspace.id === workspace.id ? "bg-brand-50" : ""
                        }`}
                      >
                        <span>{m.workspace.name}</span>
                        <span className="text-xs capitalize text-slate-500">
                          {m.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
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
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.email}
            </span>
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