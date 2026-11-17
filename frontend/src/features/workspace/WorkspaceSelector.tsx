import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { toast } from "@/lib/toast";
import {
  createWorkspace,
  listMyMemberships,
} from "@/services/workspaces";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { Membership } from "@/types/api";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export const WorkspaceSelector = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["memberships"],
    queryFn: listMyMemberships,
  });

  const createMutation = useMutation({
    mutationFn: () => createWorkspace(name.trim(), slug.trim()),
    onSuccess: (ws) => {
      toast(`Created workspace: ${ws.name}`, "success");
      qc.invalidateQueries({ queryKey: ["memberships"] });
      // Immediately switch into the new workspace.
      setWorkspace(
        {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          plan: ws.plan as any,
          subscription_status: "inactive",
          created_at: ws.created_at,
          updated_at: ws.updated_at,
        },
        "owner"
      );
      navigate("/projects", { replace: true });
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      toast(
        code === "slug_taken"
          ? "That slug is taken. Try another."
          : "Couldn't create workspace.",
        "error"
      );
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    createMutation.mutate();
  };

  const onPick = (m: Membership) => {
    setWorkspace(m.workspace, m.role);
    navigate("/projects", { replace: true });
  };

  const onNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name unless the user typed one.
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Couldn't load workspaces.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-xl font-semibold text-slate-900">
          {data.length === 0 ? "Get started" : "Choose a workspace"}
        </h1>

        {data.length === 0 && (
          <div className="card mb-4 p-6 text-center">
            <p className="text-sm text-slate-600">
              You don't belong to any workspace yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Create one to get started.
            </p>
          </div>
        )}

        {data.length > 0 && (
          <div className="mb-4 space-y-2">
            {data.map((m) => (
              <button
                key={m.membership_id}
                onClick={() => onPick(m)}
                className="card flex w-full items-center justify-between p-4 text-left transition hover:border-brand-500 hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {m.workspace.name}
                  </p>
                  <p className="text-xs text-slate-500">{m.workspace.slug}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-700">
                  {m.role}
                </span>
              </button>
            ))}
          </div>
        )}

        <Button
          variant="secondary"
          onClick={() => setCreateOpen(true)}
          className="w-full"
        >
          + New workspace
        </Button>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Create workspace"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setCreateOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-workspace"
                loading={createMutation.isPending}
              >
                Create
              </Button>
            </>
          }
        >
          <form
            id="create-workspace"
            onSubmit={onSubmit}
            className="space-y-4"
          >
            <Input
              label="Name"
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Globex"
            />
            <Input
              label="Slug"
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="globex"
              maxLength={40}
            />
            <p className="text-xs text-slate-500">
              The slug is used in URLs. Lowercase letters, numbers, and dashes
              only.
            </p>
          </form>
        </Modal>
      </div>
    </div>
  );
};