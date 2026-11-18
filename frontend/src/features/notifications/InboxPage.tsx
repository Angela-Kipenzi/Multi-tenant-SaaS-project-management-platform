import { AppShell } from "@/components/AppShell";
import { Spinner } from "@/components/Spinner";
import { useNotifications, useMarkRead } from "./useNotifications";

const kindLabel: Record<string, string> = {
  assigned: "assigned to you",
  commented: "commented on",
  status_changed: "status changed on",
};

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

export const InboxPage = () => {
  const { data: notifications, isLoading } = useNotifications();
  const markReadMutation = useMarkRead();

  const unread = notifications?.filter((n) => !n.read_at) ?? [];
  const read = notifications?.filter((n) => n.read_at) ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Inbox</h1>
          <p className="text-sm text-slate-500">
            Activity in this workspace ·{" "}
            {unread.length > 0 ? `${unread.length} unread` : "All caught up"}
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12"><Spinner /></div>
        )}

        {!isLoading && (!notifications || notifications.length === 0) && (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">You're all caught up.</p>
            <p className="mt-1 text-xs text-slate-500">
              Notifications appear here when issues are assigned to you or commented on.
            </p>
          </div>
        )}

        {unread.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Unread
            </h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {unread.map((n) => {
                const actor = n.actor_display_name ?? n.actor_email ?? "Someone";
                const key = n.issue_key ?? "an issue";
                const preview =
                  typeof n.payload?.preview === "string" ? n.payload.preview : null;

                return (
                  <div
                    key={n.id}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 bg-brand-50/30 px-4 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
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
                      <p className="mt-1 text-xs text-slate-500">{formatWhen(n.created_at)}</p>
                    </div>
                    <button
                      onClick={() => markReadMutation.mutate(n.id)}
                      disabled={markReadMutation.isPending}
                      className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Mark read
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {read.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Earlier
            </h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {read.slice(0, 50).map((n) => (
                <div key={n.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">
                      {String(n.payload?.issue_key ?? "An issue")}
                    </span>{" "}
                    {kindLabel[n.kind] ?? n.kind}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatWhen(n.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
};