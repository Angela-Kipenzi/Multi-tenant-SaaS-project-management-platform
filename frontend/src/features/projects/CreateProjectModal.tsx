import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useCreateProject } from "./useProjects";


interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreateProjectModal = ({ open, onClose }: Props) => {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const mutation = useCreateProject();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      { name, key: key.toUpperCase(), description },
      {
        onSuccess: () => {
          setName("");
          setKey("");
          setDescription("");
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New project"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="create-project" loading={mutation.isPending}>
            Create
          </Button>
        </>
      }
    >
      <form id="create-project" onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Engineering"
        />
        <Input
          label="Key"
          required
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase().slice(0, 8))}
          placeholder="ENG"
          maxLength={8}
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
        {mutation.isError && (
          <p className="text-sm text-red-600">
            Couldn't create project. Check the key (2–8 uppercase letters) and
            that you haven't hit your plan limit.
          </p>
        )}
      </form>
    </Modal>
  );
};