import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { IssueCard } from "./IssueCard";
import { useIssues, useMoveIssue } from "./useIssues";
import type { Board, Issue } from "@/types/api";

interface Props {
  board: Board;
  onIssueClick: (issue: Issue) => void;
  onAddIssue: (columnId: string) => void;
}

export const KanbanBoard = ({ board, onIssueClick, onAddIssue }: Props) => {
  const { data: issues = [] } = useIssues(board.id);
  const moveMutation = useMoveIssue(board.id);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const issuesByColumn = useMemo(() => {
    const map: Record<string, Issue[]> = {};
    for (const col of board.columns) map[col.id] = [];
    for (const issue of issues) {
      (map[issue.column] ||= []).push(issue);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.order - b.order);
    }
    return map;
  }, [board.columns, issues]);

  const activeIssue = issues.find((i) => i.id === activeId);

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    // Determine target column and order.
    let targetColumnId: string | null = null;
    let targetOrder = 0;

    // If dropped on a column, append. If dropped on a card, place before it.
    const overId = String(over.id);
    const isColumn = board.columns.some((c) => c.id === overId);

    if (isColumn) {
      targetColumnId = overId;
      targetOrder = issuesByColumn[overId]?.length ?? 0;
    } else {
      const overIssue = issues.find((i) => i.id === overId);
      if (!overIssue) return;
      targetColumnId = overIssue.column;
      targetOrder = overIssue.order;
    }

    const issue = issues.find((i) => i.id === String(active.id));
    if (!issue) return;

    if (issue.column === targetColumnId && issue.order === targetOrder) return;

    moveMutation.mutate({
      issueId: issue.id,
      columnId: targetColumnId!,
      order: targetOrder,
      expectedUpdatedAt: issue.updated_at,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            issues={issuesByColumn[col.id] ?? []}
            onIssueClick={onIssueClick}
            onAddIssue={onAddIssue}
          />
        ))}
      </div>
      <DragOverlay>
        {activeIssue ? (
          <IssueCard issue={activeIssue} onClick={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};