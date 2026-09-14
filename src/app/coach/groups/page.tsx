import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTeamOwnerId } from "@/lib/auth";
import { GroupManagement } from "@/components/GroupManagement";

export default async function GroupsPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const teamOwnerId = getTeamOwnerId(profile!);
  const isOwner = profile!.team_owner_id === null;

  let { data: groups } = await supabase
    .from("squad_groups")
    .select("id, name")
    .eq("coach_id", teamOwnerId)
    .order("name");

  if ((!groups || groups.length === 0) && isOwner) {
    const { data: seeded } = await supabase
      .from("squad_groups")
      .insert([
        { coach_id: teamOwnerId, name: "Forwards" },
        { coach_id: teamOwnerId, name: "Backs" },
      ])
      .select("id, name");
    groups = (seeded ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }

  const { data: rosterRows } = await supabase
    .from("coach_athletes")
    .select("athlete:profiles!coach_athletes_athlete_id_fkey(id, full_name, squad_group_id)")
    .eq("coach_id", teamOwnerId);

  const athletes = (rosterRows ?? [])
    .map((r) => r.athlete)
    .filter((a): a is { id: string; full_name: string; squad_group_id: string | null } => !!a)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Groups</h1>
      <GroupManagement
        coachId={teamOwnerId}
        initialGroups={groups ?? []}
        initialAthletes={athletes}
        isOwner={isOwner}
      />
    </div>
  );
}
