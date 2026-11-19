import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Spinner } from "@/components/Spinner";
import {
  useActivateSprint,
  useCloseSprint,
  useCreateSprint,
  useDeleteSprint,
  useSprints,
} from "./useSprints";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export const SprintsPanel = ({ projectId }: { projectId: string }) => {
  const { data: sprints, isLoading } = useSprints(projectId);
  const createMutation = useCreateSprint(projectId);
  const activateMutation = useActivateSprint(projectId);
  const closeMutation = useCloseSprint(projectId);
  const deleteMutation = useDeleteSprint(projectId);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const active = sprints?.find((s) => s.is_active);
  const inactive = sprints?.filter((s) => !s.is_active) ?? [];

  const onCloseActive = () => {
    if (!active) return;
    if (
      confirm(
        `Close "${active.name}"? Incomplete issues will return to the backlog.`
      )
    ) {
      closeMutation.mutate(active.id);
    }
  };

  const onDelete = (sprintId: string, sprintName: string) => {
    if (confirm(`Delete "${sprintName}"? This cannot be undone.`)) {
      deleteMutation.mutate(sprintId);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Sprint
          </span>
          {isLoading ? (
            <Spinner className="h-3 w-3" />
          ) : active ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {active.name}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          ) : (
            <span className="text-sm text-slate-500">No active sprint</span>
          )}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          + New sprint
        </button>
      </div>

      {/* Active sprint details */}
      {active && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              {goal && (
                <p className="text-sm text-slate-700">
                  <span className="font-medium text-slate-500">Goal:</span>{" "}
                  {goal}
                </p>
              )}
              <p className="text-xs text-slate-500">
                {active.start_date && formatDate(active.start_date)}
                {active.start_date && active.end_date && " – "}
                {active.end_date && formatDate(active.end_date)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to={`/projects/${projectId}/sprints/${active.id}`}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                View details
              </Link>
              <button
                onClick={onCloseActive}
                disabled={closeMutation.isPending}
                className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
              >
                {closeMutation.isPending ? "Closing…" : "Close Sprint"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state — show upcoming sprints when no sprint is active */}
      {!isLoading && !active && inactive.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Upcoming
          </p>
          <div className="space-y-2">
            {inactive.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {s.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.start_date ? formatDate(s.start_date) : "No start date"}
                    {s.start_date && s.end_date && " – "}
                    {s.end_date ? formatDate(s.end_date) : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => activateMutation.mutate(s.id)}
                    disabled={activateMutation.isPending}
                    className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
                  >
                    Activate Sprint
                  </button>
                  <button
                    onClick={() => onDelete(s.id, s.name)}
                    disabled={deleteMutation.isPending}
                    className="text-slate-400 transition hover:text-red-600 disabled:opacity-50"
                    title="Delete sprint"
                    aria-label={`Delete ${s.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {inactive.length > 3 && (
              <p className="text-xs text-slate-400">
                +{inactive.length - 3} more scheduled
              </p>
            )}
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New sprint"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!name.trim()) return;
                createMutation.mutate(
                  {
                    name: name.trim(),
                    goal: goal.trim(),
                    startDate: startDate || null,
                    endDate: endDate || null,
                  },
                  {
                    onSuccess: () => {
                      setName("");
                      setGoal("");
                      setStartDate("");
                      setEndDate("");
                      setCreateOpen(false);
                    },
                  }
                );
              }}
              loading={createMutation.isPending}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Sprint name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sprint 1"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Goal (optional)
            </label>
            <textarea
              className="input min-h-[60px]"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Complete onboarding workflow"
            />
          </div>
          <Input
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};