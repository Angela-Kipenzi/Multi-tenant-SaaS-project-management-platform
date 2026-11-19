import { useReport } from "./useReport";
import { Spinner } from "@/components/Spinner";
import { Avatar } from "@/components/Avatar";

const statusColors: Record<string, string> = {
    todo: "bg-slate-400",
    in_progress: "bg-blue-500",
    review: "bg-amber-500",
    done: "bg-emerald-500",
};

const priorityColors: Record<string, string> = {
    low: "bg-slate-400",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-600",
};

interface BarProps {
    label: string;
    count: number;
    total: number;
    color: string;
}

const Bar = ({ label, count, total, color }: BarProps) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="w-28 truncate text-sm capitalize text-slate-700">
                {label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="w-14 text-right text-sm tabular-nums text-slate-500">
                {count} <span className="text-xs text-slate-400">({pct}%)</span>
            </span>
        </div>
    );
};

export const ReportsView = ({ boardId }: { boardId: string }) => {
    const { data: report, isLoading } = useReport(boardId);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (!report) {
        return <p className="text-sm text-slate-500">No report data.</p>;
    }

    if (report.total === 0) {
        return (
            <div className="card p-12 text-center">
                <p className="text-slate-600">
                    No issues yet. Create some to see analytics.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="card p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Total issues
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {report.total}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Completed
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-600">
                        {report.done}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Completion
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {report.completion_pct}%
                    </p>
                </div>
            </div>

            {/* Progress bar full width */}
            <div className="card p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Overall progress
                </p>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${report.completion_pct}%` }}
                    />
                </div>
            </div>

            {/* Two-column breakdowns */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="card p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                        By status
                    </h3>
                    <div className="space-y-3">
                        {report.by_status.map((s) => (
                            <Bar
                                key={s.key}
                                label={s.label}
                                count={s.count}
                                total={report.total}
                                color={statusColors[s.key] ?? "bg-slate-400"}
                            />
                        ))}
                    </div>
                </div>

                <div className="card p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                        By priority
                    </h3>
                    <div className="space-y-3">
                        {report.by_priority.map((p) => (
                            <Bar
                                key={p.key}
                                label={p.label}
                                count={p.count}
                                total={report.total}
                                color={priorityColors[p.key] ?? "bg-slate-400"}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* By assignee */}
            <div className="card p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    By assignee
                </h3>
                {report.by_assignee.length === 0 ? (
                    <p className="text-sm text-slate-500">No assignments yet.</p>
                ) : (
                    <div className="space-y-2">
                        {report.by_assignee
                            .sort((a, b) => b.count - a.count)
                            .map((a) => (
                                <div key={a.key} className="flex items-center gap-3">
                                    {a.key !== "unassigned" ? (
                                        <Avatar email={a.email} size={24} />
                                    ) : (
                                        <div className="h-6 w-6 rounded-full border-2 border-dashed border-slate-300" />
                                    )}
                                    <span className="flex-1 truncate text-sm text-slate-700">
                                        {a.email}
                                    </span>
                                    <span className="text-sm tabular-nums text-slate-500">
                                        {a.count}
                                    </span>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};