import { BADGE_LABELS } from "@/lib/badges";
import type { BadgeKey } from "@/lib/supabase/types";

const PLACE_ICONS: Record<1 | 2 | 3, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function BadgeList({
  badgeKeys,
  lastMonthPlace,
}: {
  badgeKeys: BadgeKey[];
  lastMonthPlace?: 1 | 2 | 3 | null;
}) {
  if (badgeKeys.length === 0 && !lastMonthPlace) {
    return <span className="text-xs text-neutral-500">No badges yet</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {lastMonthPlace && (
        <span
          title={`${PLACE_ICONS[lastMonthPlace]} last month's podium`}
          className="rounded-full border border-amber-700 bg-amber-950/50 px-2 py-0.5 text-xs text-amber-300"
        >
          {PLACE_ICONS[lastMonthPlace]} Last month
        </span>
      )}
      {badgeKeys.map((key) => (
        <span
          key={key}
          title={BADGE_LABELS[key]}
          className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-xs text-neutral-300"
        >
          🏅 {BADGE_LABELS[key]}
        </span>
      ))}
    </div>
  );
}
