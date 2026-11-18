import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBoard, listBoards, updateBoard } from "@/services/boards";
import { toast } from "@/lib/toast";

export const boardKeys = {
  forProject: (projectId: string) => ["boards", projectId] as const,
};

export const useBoards = (projectId: string) =>
  useQuery({
    queryKey: boardKeys.forProject(projectId),
    queryFn: () => listBoards(projectId),
    enabled: !!projectId,
  });

export const useCreateBoard = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createBoard(projectId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.forProject(projectId) });
    },
  });
};

export const useUpdateBoard = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { boardId: string; name: string }) =>
      updateBoard(args.boardId, args.name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.forProject(projectId) });
      toast("Board renamed.", "success");
    },
    onError: () => {
      toast("Couldn't rename board.", "error");
    },
  });
};