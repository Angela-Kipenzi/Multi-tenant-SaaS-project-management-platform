import { useEffect, useRef, useState } from "react";
import { useNotifications, useMarkRead } from "./useNotifications";

const formatTime = (iso: string) => {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
};

export const NotificationBell = () => {
  const { data: notifications } = useNotifications();
  const markReadMutation = useMarkRead();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100"
        aria-label="Notifications"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-2">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                No notifications yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                  {notifications.slice(0, 20).map((n) => {
                    const actor = n.actor_display_name ?? n.actor_email ?? "Someone";
                    const key = n.issue_key ?? "an issue";
                    const preview =
                      typeof n.payload?.preview === "string" ? n.payload.preview : null;

                    return (
                      <li
                        key={n.id}
                        className={`px-4 py-3 ${!n.read_at ? "bg-brand-50" : ""}`}
                      >
                        <p className="text-sm text-slate-900">
                          <span className="font-medium">{actor}</span>{" "}
                          {n.kind === "assigned"
                            ? "assigned"
                            : n.kind === "commented"
                              ? "commented on"
                              : "updated"}{" "}
                          <span className="font-mono text-xs">{key}</span>
                          {n.kind === "assigned" ? " to you" : ""}
                        </p>
                        {preview && (
                          <p className="mt-1 line-clamp-2 text-xs italic text-slate-600">
                            "{preview}"
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {formatTime(n.created_at)}
                        </p>
                        {!n.read_at && (
                          <button
                            onClick={() => markReadMutation.mutate(n.id)}
                            className="mt-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            Mark as read
                          </button>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};