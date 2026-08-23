import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { buildProgressSeries, buildPersonalRecords } from "@/lib/progress";
import { ProgressChart } from "@/components/ProgressChart";
import { PersonalRecordsTable } from "@/components/PersonalRecordsTable";

export default async function AthleteProgressPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: loggedSets } = await supabase
    .from("logged_sets")
    .select(
      "weight, workout_exercise:workout_exercises(exercise:exercises(name), workout:workouts(scheduled_date))"
    )
    .eq("athlete_id", profile!.id);

  const series = buildProgressSeries(
    (loggedSets ?? []).map((row) => ({
      weight: row.weight,
      workout_exercise: Array.isArray(row.workout_exercise)
        ? row.workout_exercise[0] ?? null
        : row.workout_exercise,
    }))
  );

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">My progress</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">
          Personal records
        </h2>
        <PersonalRecordsTable records={buildPersonalRecords(series)} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">Progress</h2>
        <ProgressChart series={series} />
      </section>
    </div>
  );
}
