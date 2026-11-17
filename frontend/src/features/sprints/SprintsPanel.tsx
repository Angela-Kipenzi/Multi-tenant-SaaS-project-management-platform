import { useState } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Spinner } from "@/components/Spinner";
import {
  useActivateSprint,
  useCloseSprint,
  useCreateSprint,
  useSprints,
} from "./useSprints";

export const SprintsPanel = ({ projectId }: { projectId: string }) => {
  const { data: sprints, isLoading } = useSprints(projectId);
  const createMutation = useCreateSprint(projectId);
  const activateMutation = useActivateSprint(projectId);
  const closeMutation = useCloseSprint(projectId);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const active = sprints?.find((s) => s.is_active);
  const inactive = sprints?.filter((s) => !s.is_active) ?? [];

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Sprint
          </span>
          {isLoading ? (
            <Spinner className="h-3 w-3" />
          ) : active ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {active.name}
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Active
              </span>
              <button
                onClick={() => {
                  if (confirm(`Close "${active.name}"? Incomplete issues return to backlog.`)) {
                    closeMutation.mutate(active.id);
                  }
                }}
                disabled={closeMutation.isPending}
                className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
              >
                {closeMutation.isPending ? "Closing…" : "Close sprint"}
              </button>
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

      {inactive.length > 0 && !active && (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <p className="mb-1 text-xs text-slate-500">Upcoming</p>
          <div className="flex flex-wrap gap-2">
            {inactive.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700"
              >
                <span>{s.name}</span>
                <button
                  onClick={() => activateMutation.mutate(s.id)}
                  disabled={activateMutation.isPending}
                  className="text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  Activate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    startDate: startDate || null,
                    endDate: endDate || null,
                  },
                  {
                    onSuccess: () => {
                      setName("");
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