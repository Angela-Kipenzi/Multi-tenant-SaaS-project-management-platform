import type { SprintStatus } from "@/types/api";

const config: Record<SprintStatus, { dot: string; bg: string; text: string; label: string }> = {
    active: {
        dot: "bg-emerald-500",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        label: "Active",
    },
    planned: {
        dot: "bg-slate-400",
        bg: "bg-slate-100",
        text: "text-slate-700",
        label: "Planned",
    },
    completed: {
        dot: "bg-blue-500",
        bg: "bg-blue-50",
        text: "text-blue-700",
        label: "Completed",
    },
    overdue: {
        dot: "bg-red-500",
        bg: "bg-red-50",
        text: "text-red-700",
        label: "Overdue",
    },
};

export const SprintStatusBadge = ({ status }: { status: SprintStatus }) => {
    const c = config[status];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full ${c.bg} px-2.5 py-1 text-xs font-medium ${c.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
};