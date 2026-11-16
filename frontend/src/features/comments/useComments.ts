import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createComment,
  deleteComment,
  listComments,
} from "@/services/comments";
import { toast } from "@/lib/toast";

export const commentKeys = {
  forIssue: (issueId: string) => ["comments", issueId] as const,
};

export const useComments = (issueId: string) =>
  useQuery({
    queryKey: commentKeys.forIssue(issueId),
    queryFn: () => listComments(issueId),
    enabled: !!issueId,
  });

export const useCreateComment = (issueId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => createComment(issueId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.forIssue(issueId) });
    },
    onError: () => {
      toast("Couldn't post comment.", "error");
    },
  });
};

export const useDeleteComment = (issueId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.forIssue(issueId) });
    },
  });
};