import { AppShell } from "@/components/AppShell";
import { useProjects } from "@/features/projects/useProjects";
import { useMyTasks } from "@/features/my-tasks/useMyTasks";
import { useNotifications } from "@/features/notifications/useNotifications";
import { Link } from "react-router-dom";

export const OverviewPage = () => {
    const { data: projects } = useProjects();
    const { data: tasks } = useMyTasks();
    const { data: notifications } = useNotifications();

    const unread = notifications?.filter((n) => !n.read_at).length ?? 0;

    return (
        <AppShell crumbs={[{ label: "Overview" }]}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
                    <p className="text-sm text-slate-500">What's happening in this workspace</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Link to="/projects" className="card p-4 transition hover:shadow-md">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Projects
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">
                            {projects?.length ?? "—"}
                        </p>
                    </Link>
                    <Link to="/my-tasks" className="card p-4 transition hover:shadow-md">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            My tasks
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">
                            {tasks?.length ?? "—"}
                        </p>
                    </Link>
                    <Link to="/inbox" className="card p-4 transition hover:shadow-md">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Unread
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">{unread}</p>
                    </Link>
                </div>
            </div>
        </AppShell>
    );
};