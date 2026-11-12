import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/Spinner";
import { listMyMemberships } from "@/services/workspaces";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { Membership } from "@/types/api";

export const WorkspaceSelector = () => {
  const navigate = useNavigate();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["memberships"],
    queryFn: listMyMemberships,
  });

  const onPick = (m: Membership) => {
    setWorkspace(m.workspace, m.role);
    navigate("/projects", { replace: true });
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

  if (data.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="card max-w-md p-6 text-center">
          <h2 className="text-lg font-semibold">No workspaces yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ask an admin to invite you, or create one via the API.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-xl font-semibold text-slate-900">
          Choose a workspace
        </h1>
        <div className="space-y-2">
          {data.map((m) => (
            <button
              key={m.membership_id}
              onClick={() => onPick(m)}
              className="card flex w-full items-center justify-between p-4 text-left transition hover:border-brand-500 hover:shadow-md"
            >
              <div>
                <p className="font-medium text-slate-900">{m.workspace.name}</p>
                <p className="text-xs text-slate-500">{m.workspace.slug}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-700">
                {m.role}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};