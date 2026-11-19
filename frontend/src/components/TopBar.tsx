import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { Crumb } from "@/components/AppShell";

interface TopBarProps {
  crumbs?: Crumb[];
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const TopBar = ({ crumbs = [], onToggleSidebar, sidebarOpen }: TopBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const { clear } = useWorkspaceStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [settingsOpen]);

  const autoCrumbs: Crumb[] = [];
  if (location.pathname.startsWith("/projects") && !location.pathname.includes("/boards"))
    autoCrumbs.push({ label: "Projects" });
  if (location.pathname.startsWith("/members")) autoCrumbs.push({ label: "Members" });
  if (location.pathname.startsWith("/billing")) autoCrumbs.push({ label: "Billing" });
  if (location.pathname.startsWith("/inbox")) autoCrumbs.push({ label: "Inbox" });
  if (location.pathname.startsWith("/my-tasks")) autoCrumbs.push({ label: "My tasks" });
  if (location.pathname.startsWith("/overview")) autoCrumbs.push({ label: "Overview" });

  const displayCrumbs = crumbs.length > 0 ? crumbs : autoCrumbs;

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
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <Link to="/projects" className="flex items-center gap-2">
          <svg
            className="h-8 w-8"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top chevron — lighter blue */}
            <path
              d="M10 10 L20 10 L28 18 L28 22 L24 22 L16 14 L10 14 Z"
              fill="#3b82f6"
            />
            {/* Middle chevron — medium blue */}
            <path
              d="M6 18 L16 18 L24 26 L24 30 L20 30 L12 22 L6 22 Z"
              fill="#2563eb"
            />
            {/* Bottom chevron — dark blue */}
            <path
              d="M4 26 L14 26 L22 34 L22 38 L18 38 L10 30 L4 30 Z"
              fill="#1e40af"
            />
          </svg>
          <span className="hidden text-base font-bold tracking-tight text-slate-900 md:inline">
            FlowForge
          </span>
        </Link>

        {/* Collapse sidebar — icon representing a sidebar */}
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          aria-label="Toggle sidebar"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />
            <line x1="9" y1="4" x2="9" y2="20" strokeWidth="2" />
          </svg>
        </button>

        <span className="hidden text-slate-300 md:inline">|</span>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          {displayCrumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-2">
              {c.to ? (
                <Link to={c.to} className="text-slate-500 hover:text-slate-700">
                  {c.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-900">{c.label}</span>
              )}
              {i < displayCrumbs.length - 1 && <span className="text-slate-300">›</span>}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
      

        <NotificationBell />

        {/* Settings */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100"
            title="Settings"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {settingsOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
              <Link
                to="/members"
                onClick={() => setSettingsOpen(false)}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Manage members
              </Link>
              <Link
                to="/billing"
                onClick={() => setSettingsOpen(false)}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Billing &amp; plan
              </Link>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => {
                  setSettingsOpen(false);
                  onLogout();
                }}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};