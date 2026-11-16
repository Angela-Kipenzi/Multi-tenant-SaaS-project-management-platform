import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Spinner } from "@/components/Spinner";
import { CommentsSection } from "@/features/comments/CommentsSection";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useAuthStore } from "@/store/authStore";
import { listMembers } from "@/services/workspaces";
import type { Member } from "@/services/workspaces";
import type { IssuePriority } from "@/types/api";
import {
  useDeleteIssue,
  useIssueDetail,
  useUpdateIssue,
} from "./useIssueDetail";

const priorityOptions: IssuePriority[] = ["low", "medium", "high", "urgent"];

interface Props {
  issueId: string | null;
  boardId: string;
  onClose: () => void;
}

export const IssueDetailModal = ({ issueId, boardId, onClose }: Props) => {
  const { role } = useWorkspaceStore();
  const { user } = useAuthStore();
  const { data: issue, isLoading } = useIssueDetail(issueId ?? "", !!issueId);
  const updateMutation = useUpdateIssue(boardId);
  const deleteMutation = useDeleteIssue(boardId);

  const [members, setMembers] = useState<Member[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!issue) return;
    setTitle(issue.title);
    setDescription(issue.description);
    setPriority(issue.priority);
    setAssigneeId(issue.assignee);
    setDirty(false);
  }, [issue]);

  useEffect(() => {
    if (!issueId) return;
    listMembers().then(setMembers).catch(() => {});
  }, [issueId]);

  const canEdit = role === "owner" || role === "admin" || issue?.assignee === user?.id;
  const canDelete = role === "owner" || role === "admin";

  const onSave = () => {
    if (!issue) return;
    updateMutation.mutate(
      {
        issueId: issue.id,
        title,
        description,
        priority,
        assigneeId,
      },
      {
        onSuccess: () => {
          setDirty(false);
        },
      }
    );
  };

  const onDelete = () => {
    if (!issue) return;
    if (!window.confirm("Delete this issue? This cannot be undone.")) return;
    deleteMutation.mutate(issue.id, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Modal
      open={!!issueId}
      onClose={onClose}
      title={issue ? `${issue.key} · ${issue.title}` : "Loading…"}
      footer={
        <>
          {canDelete && (
            <Button
              variant="secondary"
              onClick={onDelete}
              loading={deleteMutation.isPending}
              className="mr-auto text-red-600 hover:bg-red-50"
            >
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} type="button">
            Close
          </Button>
          {canEdit && (
            <Button
              onClick={onSave}
              loading={updateMutation.isPending}
              disabled={!dirty}
            >
              Save changes
            </Button>
          )}
        </>
      }
    >
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {issue && (
        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            disabled={!canEdit}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              className="input min-h-[100px]"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDirty(true);
              }}
              disabled={!canEdit}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Priority
              </label>
              <select
                className="input"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value as IssuePriority);
                  setDirty(true);
                }}
                disabled={!canEdit}
              >
                {priorityOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Assignee
              </label>
              <select
                className="input"
                value={assigneeId ?? ""}
                onChange={(e) => {
                  setAssigneeId(e.target.value || null);
                  setDirty(true);
                }}
                disabled={!canEdit}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div>
                <span className="font-medium">Reporter:</span>{" "}
                {issue.reporter ? "a user" : "—"}
              </div>
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(issue.created_at).toLocaleDateString()}
              </div>
            </div>
            <CommentsSection issueId={issue.id} />
          </div>
        </div>
      )}
    </Modal>
  );
};