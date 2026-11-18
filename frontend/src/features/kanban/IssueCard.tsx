import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar } from "@/components/Avatar";
import { tagColor } from "@/lib/tags";
import { priorityMeta } from "@/lib/priority";
import type { Issue } from "@/types/api";

interface Props {
  issue: Issue;
  onClick: () => void;
  commentCount?: number;
}

const deriveTag = (title: string): string => {
  const first = title.split(" ")[0]?.toLowerCase() ?? "";
  if (first.length < 3) return "task";
  return first;
};

const formatDue = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const IssueCard = ({ issue, onClick, commentCount = 0 }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const tag = deriveTag(issue.title);
  const pr = priorityMeta[issue.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing"
    >
      {/* Top row: tag + menu */}
      <div className="flex items-center justify-between">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tagColor(tag)}`}
        >
          {tag}
        </span>
        <svg
          className="h-3.5 w-3.5 text-slate-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </div>

      {/* Title */}
      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-slate-900">
        {issue.title}
      </h3>

      {/* Issue ID + priority */}
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          {pr.icon === "chevron-up" && (
            <svg className={`h-3 w-3 ${pr.color}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3l7 7h-4v7H7v-7H3l7-7z" />
            </svg>
          )}
          {pr.icon === "chevron-down" && (
            <svg className={`h-3 w-3 ${pr.color}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 17l-7-7h4V3h6v7h4l-7 7z" />
            </svg>
          )}
          {pr.icon === "minus" && (
            <svg className={`h-3 w-3 ${pr.color}`} fill="currentColor" viewBox="0 0 20 20">
              <rect x="4" y="9" width="12" height="2" rx="1" />
            </svg>
          )}
          {pr.icon === "alert" && (
            <svg className={`h-3 w-3 ${pr.color}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 13H9v-2h2v2zm0-4H9V5h2v6z" />
            </svg>
          )}
          {issue.key}
        </span>
      </div>

      {/* Bottom row: avatar + due + comments */}
      <div className="mt-3 flex items-center justify-between">
        {issue.assignee && issue.assignee_email ? (
          <Avatar email={issue.assignee_email} size={22} />
        ) : (
          <div className="h-[22px] w-[22px] rounded-full border-2 border-dashed border-slate-300" />
        )}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDue(issue.created_at)}
          </span>
          {commentCount > 0 && (
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              {commentCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};