import { useState } from "react";
import type { FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { Avatar } from "@/components/Avatar";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { toast } from "@/lib/toast";
import type { Role } from "@/types/api";
import {
  useChangeMemberRole,
  useInviteMember,
  useMembers,
  useRemoveMember,
} from "./useMembers";

const roles: Role[] = ["owner", "admin", "member", "viewer"];

const roleBadge: Record<Role, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-slate-100 text-slate-700",
  viewer: "bg-slate-100 text-slate-500",
};

const roleDescription: Record<Role, string> = {
  owner: "Full control including billing and deletion",
  admin: "Can manage projects, boards, and members",
  member: "Can create and edit issues",
  viewer: "Read-only access",
};

export const MembersPage = () => {
  const { user } = useAuthStore();
  const { role: myRole } = useWorkspaceStore();
  const { data: members, isLoading } = useMembers();
  const inviteMutation = useInviteMember();
  const roleMutation = useChangeMemberRole();
  const removeMutation = useRemoveMember();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLinkEmail, setInviteLinkEmail] = useState<string>("");

  const canManage = myRole === "owner" || myRole === "admin";

  const onInvite = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate(
      { email: email.trim(), role: inviteRole },
      {
        onSuccess: (result) => {
          setEmail("");
          setInviteRole("member");
          setInviteOpen(false);
          // If the backend created a pending invitation, show a shareable link.
          if (result.invitation) {
            setInviteLink(
              `${window.location.origin}/accept-invite/${result.invitation.id}`
            );
            setInviteLinkEmail(result.invitation.email);
          }
        },
      }
    );
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast("Link copied to clipboard.", "success");
    } catch {
      toast("Couldn't copy. Select and copy manually.", "error");
    }
  };

  return (
    <AppShell crumbs={[{ label: "Members" }]}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Members</h1>
            <p className="text-sm text-slate-500">
              Everyone who has access to this workspace
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setInviteOpen(true)}>Invite member</Button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {members && (
          <div className="card divide-y divide-slate-100">
            {members.map((m) => {
              const isSelf = m.user.id === user?.id;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar email={m.user.email} size={32} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {m.user.email}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Joined {new Date(m.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {canManage && !isSelf ? (
                      <select
                        className="rounded border border-slate-200 px-2 py-1 text-xs"
                        value={m.role}
                        onChange={(e) =>
                          roleMutation.mutate({
                            userId: m.user.id,
                            role: e.target.value as Role,
                          })
                        }
                        disabled={roleMutation.isPending}
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleBadge[m.role]}`}
                        title={roleDescription[m.role]}
                      >
                        {m.role}
                      </span>
                    )}
                    {canManage && !isSelf && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Remove ${m.user.email} from this workspace?`
                            )
                          ) {
                            removeMutation.mutate(m.user.id);
                          }
                        }}
                        disabled={removeMutation.isPending}
                        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Invite modal */}
        <Modal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          title="Invite member"
          footer={
            <>
              <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="invite-member"
                loading={inviteMutation.isPending}
              >
                Send invite
              </Button>
            </>
          }
        >
          <form id="invite-member" onSubmit={onInvite} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                className="input"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r} — {roleDescription[r]}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>

        {/* Invitation link modal — shown when the invitee isn't a registered user */}
        <Modal
          open={!!inviteLink}
          onClose={() => setInviteLink(null)}
          title="Invitation created"
          footer={
            <>
              <Button variant="secondary" onClick={() => setInviteLink(null)}>
                Close
              </Button>
              <Button onClick={copyInviteLink}>Copy link</Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              An invitation was created for{" "}
              <span className="font-medium text-slate-900">
                {inviteLinkEmail}
              </span>
              .
            </p>
            <p className="text-sm text-slate-600">
              Share this link with them. They'll be able to sign up (if needed)
              and join the workspace automatically.
            </p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-700 break-all">
              {inviteLink}
            </div>
            <p className="text-xs text-slate-500">
              The link expires in 7 days. Email sending is not yet enabled — this
              is the share flow.
            </p>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
};