import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { BoardHeader } from "./BoardHeader";
import type { ViewMode } from "./BoardHeader";
import { KanbanBoard } from "@/features/kanban/KanbanBoard";
import { ListView } from "@/features/kanban/ListView";
import { CreateIssueModal } from "@/features/kanban/CreateIssueModal";
import { IssueDetailModal } from "@/features/kanban/IssueDetailModal";
import { SprintsPanel } from "@/features/sprints/SprintsPanel";
import { SearchModal } from "@/features/search/SearchModal";
import { useIssues } from "@/features/kanban/useIssues";
import { api, getCurrentWorkspaceId } from "@/lib/api";
import { listMembers } from "@/services/workspaces";
import type { Board,  Issue, Project } from "@/types/api";
import type { Filters} from "@/types/api";
import { useBoards, useCreateBoard, useUpdateBoard } from "./useBoards";

export const BoardPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const wsId = getCurrentWorkspaceId();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const r = await api.get<Project>(`/workspaces/${wsId}/projects/${projectId}/`);
      return r.data;
    },
    enabled: !!projectId,
  });

  const { data: boards, isLoading } = useBoards(projectId!);
  const [activeBoardId] = useState<string | null>(null);
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);
  const [detailIssueId, setDetailIssueId] = useState<string | null>(null);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [filters, setFilters] = useState<Filters>({ priorities: [], assignees: [] });

  const createBoardMutation = useCreateBoard(projectId!);
  const board: Board | null = useMemo(() => {
    if (!boards) return null;
    if (activeBoardId) return boards.find((b) => b.id === activeBoardId) ?? boards[0] ?? null;
    return boards[0] ?? null;
  }, [boards, activeBoardId]);

  const updateBoardMutation = useUpdateBoard(projectId!);

  const { data: issues = [] } = useIssues(board?.id ?? "");

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: listMembers,
    enabled: !!projectId,
  });
  const availableAssignees = members.map((m) => ({ id: m.user.id, email: m.user.email }));

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (filters.priorities.length > 0 && !filters.priorities.includes(i.priority)) return false;
      if (filters.assignees.length > 0) {
        const id = i.assignee ?? "unassigned";
        if (!filters.assignees.includes(id)) return false;
      }
      return true;
    });
  }, [issues, filters]);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-12"><Spinner /></div>
      </AppShell>
    );
  }

  if (!boards || boards.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">This project has no boards yet.</p>
          <Button onClick={() => setCreateBoardOpen(true)} className="mt-4">Create first board</Button>
        </div>
        <Modal
          open={createBoardOpen}
          onClose={() => setCreateBoardOpen(false)}
          title="New board"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateBoardOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (!newBoardName.trim()) return;
                  createBoardMutation.mutate(newBoardName.trim(), {
                    onSuccess: () => { setNewBoardName(""); setCreateBoardOpen(false); },
                  });
                }}
                loading={createBoardMutation.isPending}
              >Create</Button>
            </>
          }
        >
          <Input label="Board name" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Sprint 1" />
        </Modal>
      </AppShell>
    );
  }

  return (
    <AppShell
      crumbs={[
        { label: "Projects", to: "/projects" },
        { label: project?.name ?? "Project" },
      ]}
    >
      {board && (
        <>
          <BoardHeader
            board={board}
            issues={issues}
            filteredIssues={filteredIssues}
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNewIssue={() => {
              const firstColumn = board.columns[0]?.id;
              if (firstColumn) setCreateColumnId(firstColumn);
            }}
            onOpenSearch={() => setSearchOpen(true)}
            availableAssignees={availableAssignees}
            onRenameBoard={(name) =>
              updateBoardMutation.mutate({ boardId: board.id, name })
            }
            renaming={updateBoardMutation.isPending}
          />
          <div className="mt-4">
            <SprintsPanel projectId={projectId!} />
          </div>

          <div className="mt-6">
            {viewMode === "board" ? (
              <KanbanBoard
                board={board}
                issuesOverride={filteredIssues}
                onIssueClick={(issue: Issue) => setDetailIssueId(issue.id)}
                onAddIssue={(columnId) => setCreateColumnId(columnId)}
              />
            ) : (
              <ListView
                issues={filteredIssues}
                onIssueClick={(issue) => setDetailIssueId(issue.id)}
              />
            )}
          </div>

          <CreateIssueModal
            open={!!createColumnId}
            onClose={() => setCreateColumnId(null)}
            boardId={board.id}
            columnId={createColumnId}
          />

          <IssueDetailModal
            issueId={detailIssueId}
            boardId={board.id}
            onClose={() => setDetailIssueId(null)}
          />

          <SearchModal
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            issues={issues}
            onSelect={(issue) => setDetailIssueId(issue.id)}
          />
        </>
      )}
    </AppShell>
  );
};
