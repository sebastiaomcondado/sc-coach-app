import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildProgressSeries } from "@/lib/progress";
import { ProgressChart } from "@/components/ProgressChart";

export default async function AthleteDetailPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", athleteId)
    .single();

  if (!athlete) notFound();

  const [{ data: workouts }, { data: loggedSets }] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, title, scheduled_date")
      .eq("athlete_id", athleteId)
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("logged_sets")
      .select(
        "weight, workout_exercise:workout_exercises(exercise:exercises(name), workout:workouts(scheduled_date))"
      )
      .eq("athlete_id", athleteId),
  ]);

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
      <Link href="/coach" className="mb-4 inline-block text-sm text-neutral-400 hover:text-white">
        ← Roster
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-white">{athlete.full_name}</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">Progress</h2>
        <ProgressChart series={series} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">Workouts</h2>
        {!workouts || workouts.length === 0 ? (
          <p className="text-neutral-400">No workouts assigned yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {workouts.map((w) => (
              <li key={w.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-white">{w.title}</span>
                <span className="text-sm text-neutral-500">{w.scheduled_date}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
