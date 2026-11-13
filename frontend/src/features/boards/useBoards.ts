import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBoard, listBoards } from "@/services/boards";

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