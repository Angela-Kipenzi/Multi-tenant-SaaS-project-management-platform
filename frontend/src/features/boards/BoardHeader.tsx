import { useEffect, useRef, useState } from "react";
import { AvatarStack } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { FilterPopover } from "@/features/kanban/FilterPopover";
import type { Filters } from "@/features/kanban/FilterPopover";
import type { Board, Issue } from "@/types/api";

export type ViewMode = "board" | "list" | "timeline" | "reports";

interface Props {
  board: Board | null;
  issues: Issue[];
  filteredIssues: Issue[];
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  onNewIssue: () => void;
  onOpenSearch: () => void;
  availableAssignees: { id: string; email: string }[];
  onRenameBoard: (name: string) => void;
  renaming?: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export const BoardHeader = ({
  board,
  issues,
  filteredIssues,
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  onNewIssue,
  onOpenSearch,
  availableAssignees,
  onRenameBoard,
  renaming = false,
}: Props) => {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(board?.name ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setDraftName(board?.name ?? "");
    setEditingName(false);
  }, [board?.id, board?.name]);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (editingName) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingName]);

  const beginEdit = () => {
    setDraftName(board?.name ?? "");
    setEditingName(true);
  };

  const commitEdit = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== board?.name) {
      onRenameBoard(trimmed);
    } else {
      setDraftName(board?.name ?? "");
    }
    setEditingName(false);
  };

  const cancelEdit = () => {
    setDraftName(board?.name ?? "");
    setEditingName(false);
  };

  const totalIssues = issues.length;
  const visibleIssues = filteredIssues.length;
  const doneCount = filteredIssues.filter((i) => i.status === "done").length;
  const pct =
    visibleIssues > 0 ? Math.round((doneCount / visibleIssues) * 100) : 0;
  const remaining = visibleIssues - doneCount;

  // Build unique avatar users from the currently assigned issues
  const avatarUsers = Array.from(
    new Map(
      issues
        .filter((i) => i.assignee_email)
        .map((i) => [
          i.assignee_email!,
          {
            email: i.assignee_email,
            name: i.assignee_display_name,
            initials: i.assignee_initials,
          },
        ])
    ).values()
  );

  const activeFilterCount =
    filters.priorities.length + filters.assignees.length;

  return (
    <div className="border-b border-slate-200 pb-4">
      {/* Title + actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {editingName ? (
            <input
              ref={inputRef}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEdit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              className="w-full rounded-md border border-brand-500 bg-white px-2 py-1 text-2xl font-semibold tracking-tight text-slate-900 outline-none ring-1 ring-brand-500"
              placeholder="Board name"
            />
          ) : (
            <button
              type="button"
              onClick={beginEdit}
              disabled={renaming || !board}
              className="group flex max-w-full items-center gap-2 rounded-md px-1 text-left transition hover:bg-slate-100 disabled:cursor-default disabled:hover:bg-transparent"
              title="Click to rename"
            >
              <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                {board?.name ?? "Board"}
              </h1>
              <svg
                className="h-4 w-4 flex-shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          )}
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(new Date().toISOString())} · {visibleIssues} of{" "}
            {totalIssues} issue{totalIssues !== 1 ? "s" : ""}
            {activeFilterCount > 0 && " (filtered)"}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {avatarUsers.length > 0 && (
            <AvatarStack users={avatarUsers} max={3} size={28} />
          )}
          <Button
            onClick={onOpenSearch}
            variant="secondary"
            className="!py-1.5 !text-xs"
          >
            <svg
              className="mr-1.5 h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search
          </Button>
          <Button onClick={onNewIssue} className="!py-1.5 !text-xs">
            + New issue
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {visibleIssues > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center gap-4 text-xs text-slate-500">
            <span>
              <span className="font-semibold text-slate-900">{pct}%</span>{" "}
              completed
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {doneCount * 3} points done
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              {remaining * 3} remaining
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs + filter row */}
      <div className="mt-4 flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => onViewModeChange("board")}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${viewMode === "board"
              ? "border-brand-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          Board
        </button>
        <button
          onClick={() => onViewModeChange("list")}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${viewMode === "list"
              ? "border-brand-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          List
        </button>
        <button
          onClick={() => onViewModeChange("timeline")}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${viewMode === "timeline"
              ? "border-brand-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          Timeline
        </button>
        <button
          onClick={() => onViewModeChange("reports")}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${viewMode === "reports"
              ? "border-brand-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          Reports
        </button>

        <div className="ml-auto flex items-center gap-1 pb-1">
          <FilterPopover
            filters={filters}
            onChange={onFiltersChange}
            availableAssignees={availableAssignees}
          />
          <button
            onClick={() =>
              onViewModeChange(viewMode === "board" ? "list" : "board")
            }
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
            title="Toggle layout"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};