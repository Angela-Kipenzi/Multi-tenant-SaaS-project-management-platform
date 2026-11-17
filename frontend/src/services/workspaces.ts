import { api, getCurrentWorkspaceId } from "@/lib/api";
import type { Membership } from "@/types/api";

export const listMyMemberships = async () => {
  const r = await api.get<Membership[]>("/me/memberships/");
  return r.data;
};

export interface Member {
  id: string;
  user: { id: string; email: string };
  role: string;
  created_at: string;
}

export const listMembers = async (): Promise<Member[]> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.get<Member[]>(`/workspaces/${wsId}/members/`);
  return r.data;
};
export interface CreateWorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export const createWorkspace = async (
  name: string,
  slug: string
): Promise<CreateWorkspaceResponse> => {
  const r = await api.post<CreateWorkspaceResponse>("/workspaces/", {
    name,
    slug,
  });
  return r.data;
};