import { Compass, NotebookPen, Lightbulb, HelpCircle, PartyPopper, BadgeCheck, type LucideIcon } from "lucide-react";

export type HelperRole = "guide" | "planner" | "idea" | "advisor" | "cheer" | "confirm";

export const HELPER_META: Record<HelperRole, { name: string; Icon: LucideIcon }> = {
  guide: { name: "Guiden", Icon: Compass },
  planner: { name: "Planeraren", Icon: NotebookPen },
  idea: { name: "Idégivaren", Icon: Lightbulb },
  advisor: { name: "Rådgivaren", Icon: HelpCircle },
  cheer: { name: "Pepparen", Icon: PartyPopper },
  confirm: { name: "Bekräftaren", Icon: BadgeCheck },
};

export function HelperAvatar({ role, size = 40 }: { role: HelperRole; size?: number }) {
  const { Icon } = HELPER_META[role];
  const badge = Math.max(14, Math.round(size * 0.4));

  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx="32" cy="32" r="32" fill="var(--color-frost-2)" />
        <circle cx="14" cy="30" r="4.5" fill="white" stroke="var(--color-forest)" strokeWidth="2" />
        <circle cx="50" cy="30" r="4.5" fill="white" stroke="var(--color-forest)" strokeWidth="2" />
        <rect x="15" y="12" width="34" height="30" rx="13" fill="white" stroke="var(--color-forest)" strokeWidth="2.5" />
        <circle cx="26" cy="27" r="2.6" fill="var(--color-forest)" />
        <circle cx="38" cy="27" r="2.6" fill="var(--color-forest)" />
        <path d="M25 34 Q32 39 39 34" stroke="var(--color-forest)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path
          d="M32 47 C29 44 24 45 24 49 C24 52.5 32 57 32 57 C32 57 40 52.5 40 49 C40 45 35 44 32 47 Z"
          fill="var(--color-amber)"
        />
      </svg>
      <div
        className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-white border-2"
        style={{ width: badge, height: badge, borderColor: "var(--color-amber)" }}
      >
        <Icon size={Math.round(badge * 0.55)} strokeWidth={2.5} color="var(--color-amber-deep)" />
      </div>
    </div>
  );
}
