import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateSprint,
  closeSprint,
  createSprint,
  listSprints,
} from "@/services/sprints";
import { toast } from "@/lib/toast";

export const sprintKeys = {
  forProject: (projectId: string) => ["sprints", projectId] as const,
};

export const useSprints = (projectId: string) =>
  useQuery({
    queryKey: sprintKeys.forProject(projectId),
    queryFn: () => listSprints(projectId),
    enabled: !!projectId,
  });

export const useCreateSprint = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { name: string; startDate?: string | null; endDate?: string | null }) =>
      createSprint({ projectId, ...args }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.forProject(projectId) });
      toast("Sprint created.", "success");
    },
    onError: () => toast("Couldn't create sprint.", "error"),
  });
};

export const useActivateSprint = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activateSprint,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.forProject(projectId) });
      toast("Sprint activated.", "success");
    },
  });
};

export const useCloseSprint = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: closeSprint,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.forProject(projectId) });
      toast("Sprint closed. Incomplete issues returned to backlog.", "success");
    },
    onError: () => toast("Couldn't close sprint.", "error"),
  });
};