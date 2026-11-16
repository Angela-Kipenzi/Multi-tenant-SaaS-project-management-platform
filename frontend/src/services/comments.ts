import { api, getCurrentWorkspaceId } from "@/lib/api";

export interface Comment {
  id: string;
  issue: string;
  author: string | null;
  author_email: string | null;
  body: string;
  created_at: string;
}

export const listComments = async (issueId: string): Promise<Comment[]> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.get<Comment[]>(
    `/workspaces/${wsId}/issues/${issueId}/comments/`
  );
  return r.data;
};

export const createComment = async (
  issueId: string,
  body: string
): Promise<Comment> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.post<Comment>(
    `/workspaces/${wsId}/issues/${issueId}/comments/`,
    { body }
  );
  return r.data;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  const wsId = getCurrentWorkspaceId();
  await api.delete(`/workspaces/${wsId}/comments/${commentId}/`);
};