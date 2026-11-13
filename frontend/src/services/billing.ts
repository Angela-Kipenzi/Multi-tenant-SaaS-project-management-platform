import { api, getCurrentWorkspaceId } from "@/lib/api";

export interface BillingPlan {
  plan: string;
  subscription_status: string;
  max_projects: number;
  max_members: number;
  current_projects: number;
  current_members: number;
}

export const getBillingPlan = async (): Promise<BillingPlan> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.get<BillingPlan>(`/workspaces/${wsId}/billing/plan/`);
  return r.data;
};

export const startCheckout = async (): Promise<string> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.post<{ url: string }>(`/workspaces/${wsId}/billing/checkout/`);
  return r.data.url;
};

export const openPortal = async (): Promise<string> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.post<{ url: string }>(`/workspaces/${wsId}/billing/portal/`);
  return r.data.url;
};