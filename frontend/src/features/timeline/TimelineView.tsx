import { useMemo, useState } from "react";
import { useIssues } from "@/features/kanban/useIssues";
import { Spinner } from "@/components/Spinner";
import type { Board, Issue } from "@/types/api";

const DAY_MS = 86_400_000;
const DAYS_VISIBLE = 30;

interface Props {
    board: Board;
    onIssueClick: (issue: Issue) => void;
}

export const TimelineView = ({ board, onIssueClick }: Props) => {
    const { data: issues = [], isLoading } = useIssues(board.id);
    const [startOffset, setStartOffset] = useState(0); // in days, negative = past

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const rangeStart = useMemo(
        () => new Date(today.getTime() + startOffset * DAY_MS),
        [today, startOffset]
    );
    const rangeEnd = useMemo(
        () => new Date(rangeStart.getTime() + DAYS_VISIBLE * DAY_MS),
        [rangeStart]
    );

    const days = useMemo(() => {
        const arr: Date[] = [];
        for (let i = 0; i < DAYS_VISIBLE; i++) {
            arr.push(new Date(rangeStart.getTime() + i * DAY_MS));
        }
        return arr;
    }, [rangeStart]);

    // Each issue occupies from created_at to updated_at (or today if still open).
    
    const positioned = useMemo(() => {
        return issues
            .map((issue) => {
                const start = new Date(issue.created_at);
                const end =
                    issue.status === "done"
                        ? new Date(issue.updated_at)
                        : new Date(Math.max(today.getTime(), new Date(issue.updated_at).getTime()));

                // Position as fraction of the visible range
                const leftPct =
                    ((start.getTime() - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100;
                const rightPct =
                    ((end.getTime() - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100;

                return {
                    issue,
                    leftPct: Math.max(-50, Math.min(150, leftPct)),
                    widthPct: Math.max(0.5, Math.min(150, rightPct - leftPct)),
                    visible: rightPct > 0 && leftPct < 100,
                };
            })
            .filter((p) => p.visible);
    }, [issues, rangeStart, rangeEnd, today]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (issues.length === 0) {
        return (
            <div className="card p-12 text-center">
                <p className="text-slate-600">
                    No issues yet. Create some to see the timeline.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-slate-200 bg-white">
            {/* Header: navigation */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setStartOffset((v) => v - DAYS_VISIBLE)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                        ← Previous {DAYS_VISIBLE}d
                    </button>
                    <button
                        onClick={() => setStartOffset(0)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setStartOffset((v) => v + DAYS_VISIBLE)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                        Next {DAYS_VISIBLE}d →
                    </button>
                </div>
                <p className="text-xs text-slate-500">
                    {rangeStart.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    })}{" "}
                    –{" "}
                    {new Date(rangeEnd.getTime() - DAY_MS).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    })}
                </p>
            </div>

            {/* Timeline grid */}
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Column headers (dates) */}
                    <div className="grid" style={{ gridTemplateColumns: `200px 1fr` }}>
                        <div className="border-b border-r border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-500">
                            Issue
                        </div>
                        <div className="flex border-b border-slate-200 bg-slate-50">
                            {days.map((d, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 border-r border-slate-100 p-1 text-center text-[10px] ${d.getDay() === 0 || d.getDay() === 6
                                            ? "bg-slate-100 text-slate-400"
                                            : "text-slate-500"
                                        }`}
                                >
                                    {d.getDate()}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Issue rows */}
                    {positioned.map(({ issue, leftPct, widthPct }) => (
                        <div
                            key={issue.id}
                            className="grid border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                            style={{ gridTemplateColumns: `200px 1fr` }}
                        >
                            <button
                                onClick={() => onIssueClick(issue)}
                                className="truncate border-r border-slate-200 p-2 text-left text-sm hover:text-brand-600"
                            >
                                <span className="mr-1 font-mono text-xs text-slate-500">
                                    {issue.key}
                                </span>
                                <span className="text-slate-900">{issue.title}</span>
                            </button>
                            <div className="relative h-10">
                                <div
                                    onClick={() => onIssueClick(issue)}
                                    className="absolute top-1/2 h-2 -translate-y-1/2 cursor-pointer rounded-full bg-brand-500 transition hover:bg-brand-600"
                                    style={{
                                        left: `${Math.max(0, leftPct)}%`,
                                        width: `${widthPct}%`,
                                    }}
                                    title={`${issue.created_at.split("T")[0]} → ${issue.status === "done"
                                            ? issue.updated_at.split("T")[0]
                                            : "today"
                                        }`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
                Bars span from issue creation to completion (or today for open issues).
                {issues.length > positioned.length && (
                    <span className="ml-2 text-slate-400">
                        ({issues.length - positioned.length} outside visible range)
                    </span>
                )}
            </div>
        </div>
    );
};