import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { IssueCard } from "./IssueCard";
import type { Column, Issue } from "@/types/api";

const columnColor = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("done") || n.includes("complete")) return "bg-emerald-500";
  if (n.includes("progress")) return "bg-blue-500";
  if (n.includes("review")) return "bg-amber-500";
  if (n.includes("backlog")) return "bg-slate-400";
  return "bg-slate-400";
};

interface Props {
  column: Column;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onAddIssue: (columnId: string) => void;
}

export const KanbanColumn = ({
  column,
  issues,
  onIssueClick,
  onAddIssue,
}: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const points = issues.length * 3; // heuristic — issues have no points field yet

  return (
    <div className="flex w-80 flex-shrink-0 flex-col">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${columnColor(column.name)}`} />
          <h3 className="text-sm font-semibold text-slate-700">{column.name}</h3>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
            {issues.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{points} pts</span>
          <button
            onClick={() => onAddIssue(column.id)}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Add issue"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`min-h-[200px] flex-1 space-y-2 rounded-lg p-1 transition ${
          isOver ? "bg-brand-50 ring-2 ring-brand-200" : ""
        }`}
      >
        <SortableContext
          items={issues.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => onIssueClick(issue)}
            />
          ))}
        </SortableContext>

        {issues.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
            No issues
          </div>
        )}

        <button
          onClick={() => onAddIssue(column.id)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add issue
        </button>
      </div>
    </div>
  );
};