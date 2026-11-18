import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Spinner } from "@/components/Spinner";
import { priorityMeta } from "@/lib/priority";
import { useMyTasks } from "./useMyTasks";

export const MyTasksPage = () => {
    const { data: tasks, isLoading } = useMyTasks();
    const navigate = useNavigate();

    return (
        <AppShell crumbs={[{ label: "My tasks" }]}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-slate-900">My tasks</h1>
                    <p className="text-sm text-slate-500">
                        Issues assigned to you across this workspace
                    </p>
                </div>

                {isLoading && (
                    <div className="flex justify-center py-12">
                        <Spinner />
                    </div>
                )}

                {tasks && tasks.length === 0 && (
                    <div className="card p-12 text-center">
                        <p className="text-slate-600">No tasks assigned to you.</p>
                    </div>
                )}

                {tasks && tasks.length > 0 && (
                    <div className="card divide-y divide-slate-100">
                        {tasks.map((issue) => (
                            <button
                                key={issue.id}
                                onClick={() => navigate(`/projects/${issue.project}/boards`)}
                                className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="font-mono">{issue.key}</span>
                                        <span
                                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${priorityMeta[issue.priority]?.color}`}
                                        >
                                            {issue.priority}
                                        </span>
                                        <span className="capitalize">
                                            {issue.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {issue.title}
                                    </p>
                                </div>
                                <svg
                                    className="h-4 w-4 text-slate-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
};