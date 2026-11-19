import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/Button";
import { Avatar } from "@/components/Avatar";
import { SprintStatusBadge } from "./SprintStatusBadge";
import { useSprintDetail } from "./useSprintDetail";
import { useCloseSprint } from "./useSprints";
import { priorityMeta } from "@/lib/priority";
import { BackButton } from "@/components/BackButton";


const formatDate = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "—";

const statusDot: Record<string, string> = {
    todo: "bg-slate-400",
    in_progress: "bg-blue-500",
    review: "bg-amber-500",
    done: "bg-emerald-500",
};

const statusLabel: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    review: "Review",
    done: "Done",
};

type Tab = "overview" | "activity" | "members";

export const SprintDetailsPage = () => {
    const { projectId, sprintId } = useParams<{ projectId: string; sprintId: string }>();
    const navigate = useNavigate();
    const { data: sprint, isLoading } = useSprintDetail(sprintId!);
    const closeMutation = useCloseSprint(projectId!);
    const [tab, setTab] = useState<Tab>("overview");

    if (isLoading) {
        return (
            <AppShell>
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            </AppShell>
        );
    }

    if (!sprint) {
        return (
            <AppShell>
                <p className="text-sm text-slate-500">Sprint not found.</p>
            </AppShell>
        );
    }

    const onClose = () => {
        if (
            confirm(
                `Close "${sprint.name}"? Incomplete issues will return to the backlog.`
            )
        ) {
            closeMutation.mutate(sprint.id, {
                onSuccess: () => navigate(`/projects/${projectId}/boards`),
            });
        }
    };

    const total = sprint.metrics.total;
    const done = sprint.metrics.done;
    const pct = sprint.metrics.completion_pct;

    return (
        <AppShell
            crumbs={[
                { label: "Projects", to: "/projects" },
                { label: sprint.project_name, to: `/projects/${projectId}/boards` },
                { label: sprint.name },
            ]}
        >
            <div className="mx-auto max-w-5xl">
                <div className="mb-4">
                    <BackButton fallback={`/projects/${projectId}/boards`} />
                </div>
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                                    {sprint.name}
                                </h1>
                                <SprintStatusBadge status={sprint.status} />
                            </div>
                            {sprint.goal && (
                                <p className="mt-2 text-sm text-slate-600">{sprint.goal}</p>
                            )}
                            <p className="mt-3 text-sm text-slate-500">
                                {formatDate(sprint.start_date)} – {formatDate(sprint.end_date)}
                                {sprint.days_left !== null && sprint.days_left >= 0 && (
                                    <span className="ml-2">· {sprint.days_left} days left</span>
                                )}
                                {sprint.days_left !== null && sprint.days_left < 0 && (
                                    <span className="ml-2 text-red-600">
                                        · {Math.abs(sprint.days_left)} days overdue
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {sprint.is_active && (
                                <Button
                                    variant="secondary"
                                    onClick={onClose}
                                    loading={closeMutation.isPending}
                                >
                                    Close Sprint
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Metric cards */}
                <div className="grid gap-4 sm:grid-cols-4">
                    <MetricCard label="Issues" value={total} />
                    <MetricCard label="Completed" value={done} accent="emerald" />
                    <MetricCard label="Remaining" value={sprint.metrics.remaining} />
                    <MetricCard
                        label="Progress"
                        value={`${pct}%`}
                        accent={pct >= 100 ? "emerald" : undefined}
                    />
                </div>

                {/* Progress bar */}
                <div className="card mt-4 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">Sprint progress</span>
                        <span className="text-slate-500">
                            {done} of {total} issue{total !== 1 ? "s" : ""} completed ·{" "}
                            {sprint.metrics.points_done} of {sprint.metrics.points_total} pts
                        </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-6 border-b border-slate-200">
                    <div className="flex gap-1">
                        {(["overview", "activity", "members"] as Tab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition ${tab === t
                                        ? "border-brand-600 text-slate-900"
                                        : "border-transparent text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab content */}
                <div className="mt-6">
                    {tab === "overview" && <OverviewTab sprint={sprint} />}
                    {tab === "activity" && <ActivityTab />}
                    {tab === "members" && <MembersTab sprint={sprint} />}
                </div>
            </div>
        </AppShell>
    );
};

const MetricCard = ({
    label,
    value,
    accent,
}: {
    label: string;
    value: string | number;
    accent?: "emerald" | "red";
}) => {
    const valueClass =
        accent === "emerald"
            ? "text-emerald-600"
            : accent === "red"
                ? "text-red-600"
                : "text-slate-900";
    return (
        <div className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
        </div>
    );
};

const OverviewTab = ({ sprint }: { sprint: import("@/types/api").SprintDetail }) => {
    const statuses = [
        { key: "todo", count: sprint.status_breakdown.todo },
        { key: "in_progress", count: sprint.status_breakdown.in_progress },
        { key: "review", count: sprint.status_breakdown.review },
        { key: "done", count: sprint.status_breakdown.done },
    ];
    return (
        <div className="space-y-6">
            {/* Goal */}
            {sprint.goal && (
                <div className="card p-4">
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">Goal</h3>
                    <p className="text-sm text-slate-600">{sprint.goal}</p>
                </div>
            )}

            {/* Status breakdown */}
            <div className="card p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Issue breakdown
                </h3>
                <div className="space-y-2">
                    {statuses.map((s) => (
                        <div key={s.key} className="flex items-center gap-3">
                            <span
                                className={`h-2 w-2 rounded-full ${statusDot[s.key] ?? "bg-slate-300"}`}
                            />
                            <span className="flex-1 text-sm capitalize text-slate-700">
                                {statusLabel[s.key] ?? s.key}
                            </span>
                            <span className="text-sm tabular-nums text-slate-500">
                                {s.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Issues list */}
            <div className="card">
                <div className="border-b border-slate-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                        Issues in this sprint ({sprint.issues.length})
                    </h3>
                </div>
                {sprint.issues.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                        No issues assigned to this sprint yet.
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {sprint.issues.map((i) => (
                            <li key={i.id}>
                                <Link
                                    to={`/projects/${sprint.project_id}/boards`}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                                >
                                    <span className="font-mono text-xs text-slate-500">{i.key}</span>
                                    <span className="flex-1 truncate text-sm text-slate-900">
                                        {i.title}
                                    </span>
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${statusDot[i.status] ?? "bg-slate-300"}`}
                                    />
                                    <span className={`text-xs font-medium capitalize ${priorityMeta[i.priority]?.color}`}>
                                        {i.priority}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const ActivityTab = () => (
    <div className="card p-6">
        <p className="text-sm text-slate-500">
            Activity timeline — sprint edits, issue moves, and scope changes will appear
            here.
        </p>
    </div>
);

const MembersTab = ({ sprint }: { sprint: import("@/types/api").SprintDetail }) => {
    if (sprint.members.length === 0) {
        return (
            <div className="card p-8 text-center text-sm text-slate-500">
                No one is assigned to this sprint yet.
            </div>
        );
    }

    return (
        <div className="card divide-y divide-slate-100">
            {sprint.members.map((m) => {
                const pct =
                    m.assigned > 0 ? Math.round((m.completed / m.assigned) * 100) : 0;
                return (
                    <div key={m.user.id} className="flex items-center gap-4 px-4 py-3">
                        <Avatar
                            email={m.user.email}
                            name={m.user.display_name}
                            initials={m.user.initials}
                            size={36}
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900">
                                {m.user.display_name}
                            </p>
                            <p className="text-xs text-slate-500">{m.user.email}</p>
                        </div>
                        <div className="w-32">
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                                <span>{m.completed}/{m.assigned} done</span>
                                <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};