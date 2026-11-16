import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { useAuthStore } from "@/store/authStore";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "./useComments";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const CommentsSection = ({ issueId }: { issueId: string }) => {
  const { user } = useAuthStore();
  const [body, setBody] = useState("");
  const { data: comments, isLoading } = useComments(issueId);
  const createMutation = useCreateComment(issueId);
  const deleteMutation = useDeleteComment(issueId);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    createMutation.mutate(body.trim(), {
      onSuccess: () => setBody(""),
    });
  };

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        Comments {comments && `(${comments.length})`}
      </h3>

      {isLoading && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}

      {comments && comments.length === 0 && (
        <p className="text-sm text-slate-500">No comments yet.</p>
      )}

      {comments && comments.length > 0 && (
        <ul className="mb-4 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-900">
                    {c.author_email ?? "Unknown"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(c.created_at)}
                  </span>
                </div>
                {c.author === user?.id && (
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="text-xs text-slate-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="space-y-2">
        <textarea
          className="input min-h-[70px]"
          placeholder="Add a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={createMutation.isPending}
            disabled={!body.trim()}
          >
            Post comment
          </Button>
        </div>
      </form>
    </div>
  );
};