"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BADGE_LABELS } from "@/lib/badges";
import type { BadgeKey } from "@/lib/supabase/types";

const PLACE_LABELS: Record<1 | 2 | 3, string> = {
  1: "🥇 1st place",
  2: "🥈 2nd place",
  3: "🥉 3rd place",
};

export function BadgeNotificationBanner({
  athleteId,
  unseenBadgeIds,
  unseenBadgeKeys,
  podiumPlace,
  podiumMonthKey,
}: {
  athleteId: string;
  unseenBadgeIds: string[];
  unseenBadgeKeys: BadgeKey[];
  podiumPlace: 1 | 2 | 3 | null;
  podiumMonthKey: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const items = [
    ...unseenBadgeKeys.map((k) => BADGE_LABELS[k]),
    ...(podiumPlace ? [`${PLACE_LABELS[podiumPlace]} last month`] : []),
  ];

  if (items.length === 0) return null;

  async function handleDismiss() {
    setLoading(true);
    const supabase = createClient();
    if (unseenBadgeIds.length > 0) {
      await supabase.from("athlete_badges").update({ seen_at: new Date().toISOString() }).in("id", unseenBadgeIds);
    }
    if (podiumMonthKey) {
      await supabase.from("profiles").update({ podium_notice_seen_month: podiumMonthKey }).eq("id", athleteId);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center gap-3 border-b border-emerald-900/50 bg-emerald-950/50 px-4 py-2 text-center text-sm text-emerald-200">
      <span>
        🏅 New badge{items.length > 1 ? "s" : ""}: {items.join(", ")}
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        disabled={loading}
        className="rounded-md border border-emerald-700 px-2 py-0.5 text-xs text-emerald-100 hover:bg-emerald-900 disabled:opacity-50"
      >
        Got it
      </button>
    </div>
  );
}
