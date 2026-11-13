import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import {
  getBillingPlan,
  openPortal,
  startCheckout,
} from "@/services/billing";

const planLabel: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

const planPrice: Record<string, string> = {
  free: "$0",
  pro: "$29",
  enterprise: "Custom",
};

export const BillingPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["billing-plan"],
    queryFn: getBillingPlan,
  });

  const checkout = useMutation({
    mutationFn: startCheckout,
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  const portal = useMutation({
    mutationFn: openPortal,
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell>
        <p className="text-sm text-red-600">Couldn't load billing info.</p>
      </AppShell>
    );
  }

  const plan = data.plan;
  const isPaid = plan !== "free";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>
        <p className="text-sm text-slate-500">
          Manage your subscription and plan limits
        </p>

        <div className="card mt-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Current plan
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {planLabel[plan] ?? plan}
              </p>
              <p className="text-sm text-slate-600">
                {planPrice[plan] ?? "—"}
                {plan === "pro" && " / month"}
              </p>
            </div>
            {isPaid ? (
              <Button
                variant="secondary"
                onClick={() => portal.mutate()}
                loading={portal.isPending}
              >
                Manage subscription
              </Button>
            ) : (
              <Button
                onClick={() => checkout.mutate()}
                loading={checkout.isPending}
              >
                Upgrade to Pro
              </Button>
            )}
          </div>

          {checkout.isError && (
            <p className="mt-4 text-sm text-red-600">
              Couldn't start checkout. Only workspace owners can upgrade.
            </p>
          )}
          {portal.isError && (
            <p className="mt-4 text-sm text-red-600">
              Couldn't open the billing portal.
            </p>
          )}
        </div>

        <div className="card mt-4 p-6">
          <h2 className="text-sm font-semibold text-slate-900">Usage</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Projects</span>
                <span className="font-medium text-slate-900">
                  {data.current_projects} / {data.max_projects}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (data.current_projects / data.max_projects) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Members</span>
                <span className="font-medium text-slate-900">
                  {data.current_members} / {data.max_members}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (data.current_members / data.max_members) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-4 p-6">
          <h2 className="text-sm font-semibold text-slate-900">Plan comparison</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2">Feature</th>
                <th className="pb-2 text-right">Free</th>
                <th className="pb-2 text-right">Pro</th>
                <th className="pb-2 text-right">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2">Projects</td>
                <td className="py-2 text-right">3</td>
                <td className="py-2 text-right">50</td>
                <td className="py-2 text-right">500</td>
              </tr>
              <tr>
                <td className="py-2">Members</td>
                <td className="py-2 text-right">5</td>
                <td className="py-2 text-right">25</td>
                <td className="py-2 text-right">200</td>
              </tr>
              <tr>
                <td className="py-2">Price</td>
                <td className="py-2 text-right">$0</td>
                <td className="py-2 text-right">$29/mo</td>
                <td className="py-2 text-right">Custom</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
};