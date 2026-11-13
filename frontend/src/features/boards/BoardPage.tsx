import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/Button";
import { KanbanBoard } from "@/features/kanban/KanbanBoard";
import { CreateIssueModal } from "@/features/kanban/CreateIssueModal";
import { useBoards } from "./useBoards";
import type { Board, Issue } from "@/types/api";

export const BoardPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: boards, isLoading } = useBoards(projectId!);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);

  const board = activeBoard ?? boards?.[0] ?? null;

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </AppShell>
    );
  }

  if (!boards || boards.length === 0) {
    return (
      <AppShell>
        <div className="card p-12 text-center">
          <p className="text-slate-600">This project has no boards yet.</p>
          <p className="mt-1 text-xs text-slate-500">
            Boards are created via the API for now. Phase G.3 will add the UI.
          </p>
          <Link to="/projects" className="mt-4 inline-block">
            <Button variant="secondary">Back to projects</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to="/projects"
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← Projects
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">
            {board?.name ?? "Board"}
          </h1>
          {boards.length > 1 && (
            <div className="mt-2 flex gap-2">
              {boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBoard(b)}
                  className={`rounded px-2 py-1 text-xs ${
                    b.id === board?.id
                      ? "bg-brand-100 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {board && (
        <>
          <KanbanBoard
            board={board}
            onIssueClick={(_issue: Issue) => {
              // Phase G.3 adds the detail/edit modal.
            }}
            onAddIssue={(columnId) => setCreateColumnId(columnId)}
          />
          <CreateIssueModal
            open={!!createColumnId}
            onClose={() => setCreateColumnId(null)}
            boardId={board.id}
            columnId={createColumnId}
          />
        </>
      )}
    </AppShell>
  );
};