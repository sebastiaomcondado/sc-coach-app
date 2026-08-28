import { getCurrentProfile } from "@/lib/auth";
import { loadLeaderboardsData } from "@/lib/leaderboardsData";
import { LeaderboardsView } from "@/components/LeaderboardsView";

export default async function CoachLeaderboardsPage() {
  const profile = await getCurrentProfile();
  const data = await loadLeaderboardsData(profile!.id);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Leaderboards</h1>
      {data.athletes.length === 0 ? (
        <p className="text-neutral-400">No athletes on your roster yet.</p>
      ) : (
        <LeaderboardsView {...data} />
      )}
    </div>
  );
}
