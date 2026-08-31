import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getMostRecentMonday } from "@/lib/weekdays";
import { NavBar } from "@/components/NavBar";
import { GroupChangeBanner } from "@/components/GroupChangeBanner";
import { BadgeNotificationBanner } from "@/components/BadgeNotificationBanner";
import { resolveCoachId, loadLeaderboardsData } from "@/lib/leaderboardsData";
import { previousMonthKey } from "@/lib/leaderboards";
import type { BadgeKey } from "@/lib/supabase/types";

export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "athlete") redirect("/coach");

  const supabase = await createClient();
  const monday = getMostRecentMonday();
  const { data: weekMetrics } = await supabase
    .from("body_metrics")
    .select("id")
    .eq("athlete_id", profile.id)
    .gte("logged_date", monday)
    .not("bodyweight_kg", "is", null)
    .limit(1);

  const needsWeighIn = (weekMetrics ?? []).length === 0;
  const needsPosition = !profile.position;

  const hasGroupNotice = profile.squad_group_id !== profile.group_notice_seen_group_id;
  let noticeGroupName = "Unassigned";
  if (hasGroupNotice && profile.squad_group_id) {
    const { data: group } = await supabase
      .from("squad_groups")
      .select("name")
      .eq("id", profile.squad_group_id)
      .single();
    noticeGroupName = group?.name ?? "Unassigned";
  }

  const { data: unseenBadges } = await supabase
    .from("athlete_badges")
    .select("id, badge_key")
    .eq("athlete_id", profile.id)
    .is("seen_at", null);

  const lastMonthKey = previousMonthKey();
  let podiumPlace: 1 | 2 | 3 | null = null;
  if (profile.podium_notice_seen_month !== lastMonthKey) {
    const coachId = await resolveCoachId(supabase, profile);
    if (coachId) {
      const data = await loadLeaderboardsData(coachId);
      podiumPlace = data.lastMonthPodium.find((p) => p.athleteId === profile.id)?.place ?? null;
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <NavBar
        name={profile.full_name}
        links={[
          { href: "/athlete", label: "My workouts" },
          { href: "/athlete/calendar", label: "Calendar" },
          { href: "/athlete/progress", label: "My progress" },
          { href: "/athlete/tests", label: "Tests" },
          { href: "/athlete/leaderboards", label: "Leaderboards" },
          { href: "/athlete/metrics", label: "Body metrics" },
          { href: "/athlete/profile", label: "My profile" },
        ]}
      />
      {hasGroupNotice && (
        <GroupChangeBanner
          athleteId={profile.id}
          groupName={noticeGroupName}
          currentGroupId={profile.squad_group_id}
        />
      )}
      <BadgeNotificationBanner
        athleteId={profile.id}
        unseenBadgeIds={(unseenBadges ?? []).map((b) => b.id)}
        unseenBadgeKeys={(unseenBadges ?? []).map((b) => b.badge_key as BadgeKey)}
        podiumPlace={podiumPlace}
        podiumMonthKey={podiumPlace ? lastMonthKey : null}
      />
      {needsWeighIn && (
        <div className="border-b border-amber-900/50 bg-amber-950/50 px-4 py-2 text-center text-sm text-amber-200">
          Log your weight for this week —{" "}
          <Link href="/athlete/metrics" className="underline hover:text-amber-100">
            do it now
          </Link>
        </div>
      )}
      {needsPosition && (
        <div className="border-b border-amber-900/50 bg-amber-950/50 px-4 py-2 text-center text-sm text-amber-200">
          Set your position —{" "}
          <Link href="/athlete/profile" className="underline hover:text-amber-100">
            do it now
          </Link>
        </div>
      )}
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
