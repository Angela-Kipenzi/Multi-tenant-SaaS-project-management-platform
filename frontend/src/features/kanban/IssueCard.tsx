import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Issue } from "@/types/api";

const priorityColor: Record<string, string> = {
  low: "bg-slate-200 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export const IssueCard = ({
  issue,
  onClick,
}: {
  issue: Issue;
  onClick: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="card cursor-grab p-3 transition hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-mono text-slate-500">{issue.key}</p>
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
            priorityColor[issue.priority]
          }`}
        >
          {issue.priority}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-900">{issue.title}</p>
    </div>
  );
};