import { api, getCurrentWorkspaceId } from "@/lib/api";
import type { Sprint, SprintDetail } from "@/types/api";



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

export const deleteSprint = async (sprintId: string): Promise<void> => {
  const wsId = getCurrentWorkspaceId();
  await api.delete(`/workspaces/${wsId}/sprints/${sprintId}/`);
};

export const getSprintDetail = async (
  sprintId: string
): Promise<SprintDetail> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.get<SprintDetail>(
    `/workspaces/${wsId}/sprints/${sprintId}/`
  );
  return r.data;
};