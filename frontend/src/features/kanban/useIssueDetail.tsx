import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteIssue,
  getIssue,
  updateIssue,
} from "@/services/issues";
import { issueKeys } from "./useIssues";
import { toast } from "@/lib/toast";

export const useIssueDetail = (issueId: string, open: boolean) =>
  useQuery({
    queryKey: ["issue", issueId],
    queryFn: () => getIssue(issueId),
    enabled: open && !!issueId,
  });

export const useUpdateIssue = (boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateIssue,
    onSuccess: (issue) => {
      qc.invalidateQueries({ queryKey: ["issue", issue.id] });
      qc.invalidateQueries({ queryKey: issueKeys.forBoard(boardId) });
    },
    onError: () => {
      toast("Couldn't update issue.", "error");
    },
  });
};

export const useDeleteIssue = (boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteIssue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.forBoard(boardId) });
    },
    onError: () => {
      toast("Couldn't delete issue.", "error");
    },
  });
};