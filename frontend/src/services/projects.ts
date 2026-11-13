import { api } from "@/lib/api";
import { getCurrentWorkspaceId } from "@/lib/api";
import type { Project } from "@/types/api";

export const listProjects = async (): Promise<Project[]> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.get<Project[]>(`/workspaces/${wsId}/projects/`);
  return r.data;
};

export const createProject = async (
  name: string,
  key: string,
  description = ""
): Promise<Project> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.post<Project>(`/workspaces/${wsId}/projects/`, {
    name,
    key,
    description,
  });
  return r.data;
};