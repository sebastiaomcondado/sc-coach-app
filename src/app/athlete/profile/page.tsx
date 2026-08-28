import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatar";
import { ProfileForm } from "@/components/ProfileForm";
import { BadgeList } from "@/components/BadgeList";
import { resolveCoachId, loadLeaderboardsData } from "@/lib/leaderboardsData";
import type { BadgeKey } from "@/lib/supabase/types";

export default async function AthleteProfilePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const photoUrl = await getAvatarUrl(supabase, profile!.photo_path);

  const [{ data: badges }, coachId] = await Promise.all([
    supabase.from("athlete_badges").select("badge_key").eq("athlete_id", profile!.id),
    resolveCoachId(supabase, profile!),
  ]);
  const lastMonthPlace = coachId
    ? (await loadLeaderboardsData(coachId)).lastMonthPodium.find((p) => p.athleteId === profile!.id)?.place ?? null
    : null;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">My profile</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">Badges</h2>
        <BadgeList
          badgeKeys={(badges ?? []).map((b) => b.badge_key as BadgeKey)}
          lastMonthPlace={lastMonthPlace}
        />
      </section>

      <ProfileForm
        athleteId={profile!.id}
        redirectTo="/athlete"
        initial={{
          fullName: profile!.full_name,
          photoUrl,
          dateOfBirth: profile!.date_of_birth ?? "",
          position: profile!.position ?? "",
          heightCm: profile!.height_cm?.toString() ?? "",
          weightKg: profile!.weight_kg?.toString() ?? "",
          jerseyNumber: profile!.jersey_number?.toString() ?? "",
          squadGroupId: profile!.squad_group_id ?? "",
        }}
      />
    </div>
  );
}
