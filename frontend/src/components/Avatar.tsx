const PALETTE = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6",
];

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const deriveInitials = (name?: string | null, email?: string | null): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split("@")[0];
    const parts = local.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return local.slice(0, 2).toUpperCase();
  }
  return "?";
};

interface AvatarProps {
  email?: string | null;
  name?: string | null;
  initials?: string | null;
  size?: number;
  className?: string;
}

export const Avatar = ({
  email,
  name,
  initials,
  size = 28,
  className = "",
}: AvatarProps) => {
  const seed = email ?? name ?? "unknown";
  const bg = PALETTE[hashString(seed) % PALETTE.length];
  const label = initials || deriveInitials(name, email);

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: Math.max(10, size * 0.38),
      }}
      title={name ?? email ?? ""}
    >
      {label}
    </span>
  );
};

export const AvatarStack = ({
  users,
  max = 3,
  size = 28,
}: {
  users: Array<{ email?: string | null; name?: string | null; initials?: string | null }>;
  max?: number;
  size?: number;
}) => {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((u, i) => (
        <Avatar
          key={u.email ?? u.name ?? i}
          email={u.email}
          name={u.name}
          initials={u.initials}
          size={size}
        />
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