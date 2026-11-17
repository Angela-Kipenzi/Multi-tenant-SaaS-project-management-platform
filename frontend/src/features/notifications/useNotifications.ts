import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  markNotificationRead,
} from "@/services/notifications";

export const notificationKeys = { all: ["notifications"] as const };

export const useNotifications = () =>
  useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => listNotifications(),
    refetchInterval: 60_000, // poll every 60s
  });

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};