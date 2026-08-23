import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export default async function AthleteHomePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: workouts }, { data: loggedSets }] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, title, scheduled_date")
      .eq("athlete_id", profile!.id)
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("logged_sets")
      .select("workout_exercise:workout_exercises(workout_id)")
      .eq("athlete_id", profile!.id),
  ]);

  const loggedWorkoutIds = new Set(
    (loggedSets ?? [])
      .map((row) => (Array.isArray(row.workout_exercise) ? row.workout_exercise[0] : row.workout_exercise))
      .map((we) => we?.workout_id)
      .filter(Boolean)
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (workouts ?? []).filter((w) => w.scheduled_date >= today);
  const past = (workouts ?? []).filter((w) => w.scheduled_date < today);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">My workouts</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">
          Upcoming
        </h2>
        <WorkoutList workouts={upcoming} loggedWorkoutIds={loggedWorkoutIds} empty="Nothing scheduled." />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">Past</h2>
        <WorkoutList workouts={past} loggedWorkoutIds={loggedWorkoutIds} empty="No past workouts yet." />
      </section>
    </div>
  );
}

function WorkoutList({
  workouts,
  loggedWorkoutIds,
  empty,
}: {
  workouts: { id: string; title: string; scheduled_date: string }[];
  loggedWorkoutIds: Set<string>;
  empty: string;
}) {
  if (workouts.length === 0) return <p className="text-neutral-400">{empty}</p>;

  return (
    <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
      {workouts.map((w) => (
        <li key={w.id}>
          <Link
            href={`/athlete/workouts/${w.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900"
          >
            <div>
              <span className="text-white">{w.title}</span>
              <span className="ml-2 text-sm text-neutral-500">{w.scheduled_date}</span>
            </div>
            <span
              className={`text-xs ${
                loggedWorkoutIds.has(w.id) ? "text-emerald-400" : "text-neutral-500"
              }`}
            >
              {loggedWorkoutIds.has(w.id) ? "Logged" : "Not logged"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
