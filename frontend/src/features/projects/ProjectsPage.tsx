import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { CreateProjectModal } from "./CreateProjectModal";
import { useProjects } from "./useProjects";

export const ProjectsPage = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError } = useProjects();

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">Everything in this workspace</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>New project</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-600">Couldn't load projects.</p>
      )}

      {data && data.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-slate-600">No projects yet.</p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4">
            Create your first project
          </Button>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}/boards`}
              className="card p-4 transition hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="mt-0.5 text-xs font-mono text-slate-500">
                    {p.key}
                  </p>
                </div>
              </div>
              {p.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                  {p.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </AppShell>
  );
};