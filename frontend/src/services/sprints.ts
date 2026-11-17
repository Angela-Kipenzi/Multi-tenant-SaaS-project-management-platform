import { api, getCurrentWorkspaceId } from "@/lib/api";

export interface Sprint {
  id: string;
  name: string;
  project: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export const listSprints = async (projectId: string): Promise<Sprint[]> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.get<Sprint[]>(
    `/workspaces/${wsId}/projects/${projectId}/sprints/`
  );
  return r.data;
};

export const createSprint = async (args: {
  projectId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<Sprint> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.post<Sprint>(
    `/workspaces/${wsId}/projects/${args.projectId}/sprints/`,
    {
      name: args.name,
      start_date: args.startDate ?? null,
      end_date: args.endDate ?? null,
    }
  );
  return r.data;
};

export const activateSprint = async (sprintId: string): Promise<Sprint> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.post<Sprint>(
    `/workspaces/${wsId}/sprints/${sprintId}/activate/`
  );
  return r.data;
};

export const closeSprint = async (sprintId: string): Promise<Sprint> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.post<Sprint>(
    `/workspaces/${wsId}/sprints/${sprintId}/close/`
  );
  return r.data;
};