import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIssue,
  listIssues,
  moveIssue,
  updateIssue,
} from "@/services/issues";
import type { Issue } from "@/types/api";
import { toast } from "@/lib/toast";

export const issueKeys = {
  forBoard: (boardId: string) => ["issues", boardId] as const,
};

export const useIssues = (boardId: string) =>
  useQuery({
    queryKey: issueKeys.forBoard(boardId),
    queryFn: () => listIssues(boardId),
    enabled: !!boardId,
  });

export const useCreateIssue = (boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.forBoard(boardId) });
    },
  });
};

export const useUpdateIssue = (boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateIssue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.forBoard(boardId) });
    },
  });
};

/**
 * Move with optimistic update. On error, refetch the board from the server
 * (the "undo" for the optimistic change), then surface the error.
 */
export const useMoveIssue = (boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: moveIssue,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: issueKeys.forBoard(boardId) });
      const previous = qc.getQueryData<Issue[]>(issueKeys.forBoard(boardId));

      if (previous) {
        const optimistic = previous.map((i) =>
          i.id === vars.issueId
            ? { ...i, column: vars.columnId, order: vars.order }
            : i
        );
        qc.setQueryData(issueKeys.forBoard(boardId), optimistic);
      }
      return { previous };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: issueKeys.forBoard(boardId) });
    },
    onError: (err: any, _vars, ctx) => {
        if (ctx?.previous) {
            qc.setQueryData(issueKeys.forBoard(boardId), ctx.previous);
        }
        const status = err?.response?.status;
        if (status === 409) {
            toast("Someone else moved this issue first. Refreshed.", "error");
        } else {
            toast("Couldn't move issue. Try again.", "error");
        }
    },
  });
};