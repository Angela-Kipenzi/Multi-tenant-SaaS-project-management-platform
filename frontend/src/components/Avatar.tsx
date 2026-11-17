const PALETTE = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ef4444", // red
  "#14b8a6", // teal
];

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const initials = (email: string): string => {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
};

interface AvatarProps {
  email: string;
  size?: number;
  className?: string;
}

export const Avatar = ({ email, size = 28, className = "" }: AvatarProps) => {
  const bg = PALETTE[hashString(email) % PALETTE.length];
  const label = initials(email);

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: Math.max(10, size * 0.38),
      }}
      title={email}
    >
      {label}
    </span>
  );
};

export const AvatarStack = ({
  emails,
  max = 3,
  size = 28,
}: {
  emails: string[];
  max?: number;
  size?: number;
}) => {
  const shown = emails.slice(0, max);
  const extra = emails.length - shown.length;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((e) => (
        <Avatar key={e} email={e} size={size} className="ring-2 ring-white" />
      ))}
      {extra > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600 ring-2 ring-white"
          style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
};