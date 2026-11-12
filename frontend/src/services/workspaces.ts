import { api } from "@/lib/api";
import type { Membership } from "@/types/api";

export const listMyMemberships = async () => {
  const r = await api.get<Membership[]>("/me/memberships/");
  return r.data;
};