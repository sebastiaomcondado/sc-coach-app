import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTeamOwnerId } from "@/lib/auth";
import { CoachesManagement } from "@/components/CoachesManagement";

export default async function CoachesPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const teamOwnerId = getTeamOwnerId(profile!);
  const isOwner = profile!.team_owner_id === null;

  const { data: teamRows } = await supabase
    .from("profiles")
    .select("id, full_name")
    .or(`id.eq.${teamOwnerId},team_owner_id.eq.${teamOwnerId}`)
    .order("full_name");

  const team = (teamRows ?? []).map((c) => ({ id: c.id, fullName: c.full_name, isOwner: c.id === teamOwnerId }));

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-xl font-semibold text-white">Coaches</h1>
      <CoachesManagement team={team} isOwner={isOwner} currentUserId={profile!.id} />
    </div>
  );
}
