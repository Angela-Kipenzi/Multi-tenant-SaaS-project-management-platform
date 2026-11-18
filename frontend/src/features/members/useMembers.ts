import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeMemberRole,
  inviteMember,
  listMembers,
  removeMember,
} from "@/services/members";
import { toast } from "@/lib/toast";
import type { Role } from "@/types/api";

export const memberKeys = { all: ["members"] as const };

export const useMembers = () =>
  useQuery({ queryKey: memberKeys.all, queryFn: listMembers });

export const useInviteMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { email: string; role: Role }) =>
      inviteMember(args.email, args.role),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: memberKeys.all });
      if (result.membership) {
        toast("Member added.", "success");
      } else if (result.invitation) {
        toast(`Invitation sent to ${result.invitation.email}.`, "success");
      }
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const map: Record<string, string> = {
        already_member: "That user is already a member.",
        invalid_role: "Invalid role.",
        plan_limit_exceeded: "You've reached your plan's member limit.",
      };
      toast(map[code] ?? "Couldn't add member.", "error");
    },
  });
};

export const useChangeMemberRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { userId: string; role: Role }) =>
      changeMemberRole(args.userId, args.role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.all });
      toast("Role updated.", "success");
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      toast(
        code === "last_owner"
          ? "Cannot demote the last owner."
          : "Couldn't update role.",
        "error"
      );
    },
  });
};

export const useRemoveMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.all });
      toast("Member removed.", "success");
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      toast(
        code === "last_owner"
          ? "Cannot remove the last owner."
          : "Couldn't remove member.",
        "error"
      );
    },
  });
};