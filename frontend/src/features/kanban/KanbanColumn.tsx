import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { IssueCard } from "./IssueCard";
import type { Column, Issue } from "@/types/api";

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

  return (
    <div className="flex w-80 flex-shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-slate-700">{column.name}</h3>
        <span className="text-xs text-slate-500">{issues.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[200px] flex-1 space-y-2 rounded-lg border p-2 transition ${
          isOver
            ? "border-brand-500 bg-brand-50"
            : "border-slate-200 bg-slate-100/50"
        }`}
      >
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => onIssueClick(issue)}
            />
          ))}
        </SortableContext>
        <button
          onClick={() => onAddIssue(column.id)}
          className="w-full rounded-md border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700"
        >
          + Add issue
        </button>
      </div>
    </div>
  );
};