import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { CreateProjectModal } from "./CreateProjectModal";
import { useProjects } from "./useProjects";

export const ProjectsPage = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError } = useProjects();
  const [search, setSearch] = useState("");

  const filteredProjects = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <AppShell>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
            <p className="text-sm text-slate-500">Everything in this workspace</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>New project</Button>
        </div>

        <div className="mt-4 max-w-md">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by name or key…"
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
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
      {filteredProjects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => (
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
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name or key…"
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </AppShell>
  );
};