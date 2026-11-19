import { api, getCurrentWorkspaceId } from "@/lib/api";
import type { Member, Role } from "@/types/api";

export const listMembers = async (): Promise<Member[]> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.get<Member[]>(`/workspaces/${wsId}/members/`);
  return r.data;
};

export const inviteMember = async (
  email: string,
  role: Role
): Promise<{
  membership: Member | null;
  invitation: { id: string; email: string } | null;
}> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.post<{
    membership: Member | null;
    invitation: { id: string; email: string } | null;
  }>(`/workspaces/${wsId}/members/`, { email, role });
  return r.data;
};

export const changeMemberRole = async (
  userId: string,
  role: Role
): Promise<Member> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.patch<Member>(
    `/workspaces/${wsId}/members/${userId}/`,
    { role }
  );
  return r.data;
};

export const removeMember = async (userId: string): Promise<void> => {
  const wsId = getCurrentWorkspaceId();
  await api.delete(`/workspaces/${wsId}/members/${userId}/`);
};