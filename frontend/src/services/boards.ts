import { api, getCurrentWorkspaceId } from "@/lib/api";
import type { Board } from "@/types/api";

export const listBoards = async (projectId: string): Promise<Board[]> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.get<Board[]>(
    `/workspaces/${wsId}/projects/${projectId}/boards/`
  );
  return r.data;
};

export const createBoard = async (
  projectId: string,
  name: string
): Promise<Board> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.post<Board>(
    `/workspaces/${wsId}/projects/${projectId}/boards/`,
    { name }
  );
  return r.data;
};