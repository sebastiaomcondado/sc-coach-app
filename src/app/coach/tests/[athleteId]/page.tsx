import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { AthleteTestPanel } from "@/components/AthleteTestPanel";
import { computeOneRmSuggestions, ONE_RM_TEST_NAME_TO_CATEGORY } from "@/lib/tests";

export default async function CoachAthleteTestsPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: athlete }, { data: testTypes }, { data: results }, { data: loggedSets }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("id", athleteId).single(),
    supabase
      .from("test_types")
      .select("id, name, unit, higher_is_better")
      .or(`coach_id.is.null,coach_id.eq.${profile!.id}`)
      .order("name"),
    supabase
      .from("test_results")
      .select("id, test_type_id, value, logged_date")
      .eq("athlete_id", athleteId),
    supabase
      .from("logged_sets")
      .select(
        "weight, reps, workout_exercise:workout_exercises(exercise:exercises(name, one_rm_category), workout:workouts(scheduled_date))"
      )
      .eq("athlete_id", athleteId),
  ]);

  if (!athlete) notFound();

  const oneRmByCategory = computeOneRmSuggestions(
    (loggedSets ?? []).map((row) => {
      const we = Array.isArray(row.workout_exercise) ? row.workout_exercise[0] : row.workout_exercise;
      const exercise = we?.exercise ? (Array.isArray(we.exercise) ? we.exercise[0] : we.exercise) : null;
      const workout = we?.workout ? (Array.isArray(we.workout) ? we.workout[0] : we.workout) : null;
      return {
        weight: row.weight,
        reps: row.reps,
        exerciseName: exercise?.name ?? "",
        oneRmCategory: exercise?.one_rm_category ?? null,
        sessionDate: workout?.scheduled_date ?? null,
      };
    })
  );

  const oneRmSuggestions: Record<string, { value: number; source: string }> = {};
  for (const t of testTypes ?? []) {
    const category = ONE_RM_TEST_NAME_TO_CATEGORY[t.name];
    const suggestion = category ? oneRmByCategory[category] : null;
    if (suggestion) oneRmSuggestions[t.id] = suggestion;
  }

  return (
    <div>
      <Link href="/coach/tests" className="mb-4 inline-block text-sm text-neutral-400 hover:text-white">
        ← Tests
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-white">{athlete.full_name} — Tests</h1>

      <AthleteTestPanel
        athleteId={athleteId}
        testTypes={testTypes ?? []}
        initialResults={results ?? []}
        readOnly={false}
        oneRmSuggestions={oneRmSuggestions}
      />
    </div>
  );
}
