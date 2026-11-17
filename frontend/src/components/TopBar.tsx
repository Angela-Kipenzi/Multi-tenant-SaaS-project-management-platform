import { Link, useLocation } from "react-router-dom";
import { NotificationBell } from "@/features/notifications/NotificationBell";

interface Crumb {
  label: string;
  to?: string;
}

export const TopBar = ({ crumbs = [] }: { crumbs?: Crumb[] }) => {
  const location = useLocation();

  // Auto-crumb from path if none given.
  const autoCrumbs: Crumb[] = [];
  if (location.pathname.startsWith("/projects")) autoCrumbs.push({ label: "Projects", to: "/projects" });
  if (location.pathname.startsWith("/members")) autoCrumbs.push({ label: "Members" });
  if (location.pathname.startsWith("/billing")) autoCrumbs.push({ label: "Billing" });

  const displayCrumbs = crumbs.length > 0 ? crumbs : autoCrumbs;

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <nav className="flex items-center gap-2 text-sm">
        {displayCrumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {c.to ? (
              <Link to={c.to} className="text-slate-500 hover:text-slate-700">
                {c.label}
              </Link>
            ) : (
              <span className="text-slate-900 font-medium">{c.label}</span>
            )}
            {i < displayCrumbs.length - 1 && (
              <span className="text-slate-300">›</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button className="hidden items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-400 md:flex">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search issues…
          <span className="ml-6 rounded border border-slate-200 px-1 text-xs">⌘K</span>
        </button>
        <NotificationBell />
        <button
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          title="Settings"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};