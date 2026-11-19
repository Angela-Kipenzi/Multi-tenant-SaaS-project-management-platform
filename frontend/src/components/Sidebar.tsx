import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/Avatar";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { listMyMemberships } from "@/services/workspaces";
import { getBillingPlan } from "@/services/billing";
import { useNotifications } from "@/features/notifications/useNotifications";
import { useMyTasks } from "@/features/my-tasks/useMyTasks";
import { api } from "@/lib/api";

const navItem =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50";
const navItemActive = "bg-slate-100 text-slate-900 font-medium";

export const Sidebar = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, clearAuth } = useAuthStore();
  const { workspace, role, setWorkspace, clear } = useWorkspaceStore();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const { data: memberships } = useQuery({
    queryKey: ["memberships"],
    queryFn: listMyMemberships,
    enabled: !!user,
  });

  const { data: billing } = useQuery({
    queryKey: ["billing-plan"],
    queryFn: getBillingPlan,
    enabled: !!workspace,
  });

  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0;

  const { data: myTasks } = useMyTasks();
  const myTaskCount = myTasks?.length ?? 0;

  const onLogout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch {
      /* ignore */
    }
    clearAuth();
    clear();
    qc.clear();
    navigate("/login", { replace: true });
  };

  const switchWorkspace = (m: { workspace: any; role: any }) => {
    setWorkspace(m.workspace, m.role);
    qc.invalidateQueries();
    setSwitcherOpen(false);
    navigate("/projects");
  };

  const pctUsed = billing
    ? Math.round((billing.current_projects / billing.max_projects) * 100)
    : 0;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Workspace switcher */}
      {workspace && memberships && (
        <div className="relative border-b border-slate-100 p-3">
          <button
            onClick={() => setSwitcherOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-200 p-2 text-left transition hover:border-slate-300"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-sm font-semibold text-white"
            >
              {workspace.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {workspace.name}
              </p>
              <p className="truncate text-xs capitalize text-slate-500">{role}</p>
            </div>
            <svg
              className="h-3 w-3 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {switcherOpen && memberships.length > 1 && (
            <div className="absolute left-3 right-3 top-full z-30 mt-1 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
              {memberships.map((m) => (
                <button
                  key={m.membership_id}
                  onClick={() => switchWorkspace(m)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${m.workspace.id === workspace.id ? "bg-brand-50" : ""
                    }`}
                >
                  <span className="truncate">{m.workspace.name}</span>
                  <span className="text-xs capitalize text-slate-500">{m.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          <NavLink
            to="/overview"
            className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Overview
          </NavLink>

          <NavLink
            to="/my-tasks"
            className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            My tasks
            {myTaskCount > 0 && (
              <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {myTaskCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/inbox"
            className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Inbox
            {unreadCount > 0 && (
              <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {unreadCount}
              </span>
            )}
          </NavLink>
        </div>

        <div className="pt-4">
          <p className="px-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            Workspace
          </p>
          <div className="mt-2 space-y-1">
            <NavLink
              to="/projects"
              className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Projects
            </NavLink>
            <NavLink
              to="/members"
              className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Members
            </NavLink>
            <NavLink
              to="/billing"
              className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Billing
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Plan card */}
      <div className="border-t border-slate-100 p-3">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <p className="text-xs font-semibold capitalize text-slate-900">
                {workspace?.plan ?? "Free"} plan
              </p>
            </div>
            <span className="text-xs text-slate-500">{pctUsed}% used</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${Math.min(100, pctUsed)}%` }}
            />
          </div>
          <NavLink
            to="/billing"
            className="mt-2 block text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            {workspace?.plan === "free" ? "Upgrade plan" : "View plan"}
          </NavLink>
        </div>
      </div>

      {/* User */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2">
          <Avatar
            email={user?.email}
            name={user?.display_name}
            initials={user?.initials}
            size={32}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {user?.display_name ?? user?.email}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Sign out"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};