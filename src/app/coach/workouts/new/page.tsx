import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTeamOwnerId } from "@/lib/auth";
import { WorkoutBuilder } from "@/components/WorkoutBuilder";

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const teamOwnerId = getTeamOwnerId(profile!);

  const [{ data: athleteRows }, { data: exercises }, { data: templates }, { data: cycles }] =
    await Promise.all([
      supabase
        .from("coach_athletes")
        .select("athlete:profiles!coach_athletes_athlete_id_fkey(id, full_name)")
        .eq("coach_id", teamOwnerId),
      supabase.from("exercises").select("id, name, category, video_url").order("name"),
      supabase
        .from("program_templates")
        .select("id, name, cycle_id")
        .eq("coach_id", teamOwnerId)
        .order("name"),
      supabase.from("training_cycles").select("id, name").eq("coach_id", teamOwnerId).order("name"),
    ]);

  const athletes = (athleteRows ?? [])
    .map((r) => r.athlete)
    .filter((a): a is { id: string; full_name: string } => !!a)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Build & assign a workout</h1>
      <WorkoutBuilder
        athletes={athletes}
        exercises={exercises ?? []}
        templates={templates ?? []}
        cycles={cycles ?? []}
        initialTemplateId={template}
      />
    </div>
  );
}
