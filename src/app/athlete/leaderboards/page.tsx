import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { resolveCoachId, loadLeaderboardsData } from "@/lib/leaderboardsData";
import { LeaderboardsView } from "@/components/LeaderboardsView";

export default async function AthleteLeaderboardsPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const coachId = await resolveCoachId(supabase, profile!);

  const data = coachId
    ? await loadLeaderboardsData(coachId)
    : { athletes: [], groups: [], allTimeCompleted: {}, thisMonthCompleted: {}, strengthGained: {}, thisMonthPodium: [], lastMonthPodium: [], badgesByAthlete: {} };

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Leaderboards</h1>
      {data.athletes.length === 0 ? (
        <p className="text-neutral-400">Nothing to show yet.</p>
      ) : (
        <LeaderboardsView {...data} />
      )}
    </div>
  );
}
