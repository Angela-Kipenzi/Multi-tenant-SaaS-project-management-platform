import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useCreateIssue } from "./useIssues";
import type { IssuePriority } from "@/types/api";

interface Props {
  open: boolean;
  onClose: () => void;
  boardId: string;
  columnId: string | null;
}

export const CreateIssueModal = ({ open, onClose, boardId, columnId }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("medium");
  const mutation = useCreateIssue(boardId);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!columnId) return;
    mutation.mutate(
      { boardId, columnId, title, description, priority },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setPriority("medium");
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New issue"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="create-issue" loading={mutation.isPending}>
            Create
          </Button>
        </>
      }
    >
      <form id="create-issue" onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Title"
          required
          minLength={3}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            className="input min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Priority
          </label>
          <select
            className="input"
            value={priority}
            onChange={(e) => setPriority(e.target.value as IssuePriority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        {mutation.isError && (
          <p className="text-sm text-red-600">Couldn't create issue.</p>
        )}
      </form>
    </Modal>
  );
};