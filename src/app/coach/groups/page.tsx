import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { GroupManagement } from "@/components/GroupManagement";

export default async function GroupsPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  let { data: groups } = await supabase
    .from("squad_groups")
    .select("id, name")
    .eq("coach_id", profile!.id)
    .order("name");

  if (!groups || groups.length === 0) {
    const { data: seeded } = await supabase
      .from("squad_groups")
      .insert([
        { coach_id: profile!.id, name: "Forwards" },
        { coach_id: profile!.id, name: "Backs" },
      ])
      .select("id, name");
    groups = (seeded ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }

  const { data: rosterRows } = await supabase
    .from("coach_athletes")
    .select("athlete:profiles!coach_athletes_athlete_id_fkey(id, full_name, squad_group_id)")
    .eq("coach_id", profile!.id);

  const athletes = (rosterRows ?? [])
    .map((r) => r.athlete)
    .filter((a): a is { id: string; full_name: string; squad_group_id: string | null } => !!a)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Groups</h1>
      <GroupManagement coachId={profile!.id} initialGroups={groups ?? []} initialAthletes={athletes} />
    </div>
  );
}
