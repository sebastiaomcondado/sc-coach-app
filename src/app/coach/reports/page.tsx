import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getMostRecentMonday } from "@/lib/weekdays";
import {
  addDays,
  buildMonthlyEvolution,
  buildWeeklyCompletion,
  formatMonthLabel,
  getMonthRange,
  shiftMonth,
} from "@/lib/reports";
import { SendReportButton } from "@/components/SendReportButton";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; month?: string }>;
}) {
  const { week: weekParam, month: monthParam } = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const week = weekParam ?? getMostRecentMonday();
  const weekEnd = addDays(week, 6);
  const month = monthParam ?? new Date().toISOString().slice(0, 7);
  const { start: monthStart, end: monthEnd } = getMonthRange(month);

  const [{ data: rosterRows }, { data: weekWorkouts }, { data: loggedSets }] = await Promise.all([
    supabase
      .from("coach_athletes")
      .select("athlete:profiles!coach_athletes_athlete_id_fkey(id, full_name)")
      .eq("coach_id", profile!.id),
    supabase
      .from("workouts")
      .select("id, athlete_id")
      .eq("coach_id", profile!.id)
      .gte("scheduled_date", week)
      .lte("scheduled_date", weekEnd),
    supabase
      .from("logged_sets")
      .select(
        "athlete_id, weight, reps, workout_exercise:workout_exercises(exercise:exercises(name), workout:workouts(id, scheduled_date))"
      ),
  ]);

  const athletes = (rosterRows ?? [])
    .map((r) => r.athlete)
    .filter((a): a is { id: string; full_name: string } => !!a)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  const normalizedLoggedSets = (loggedSets ?? []).map((row) => {
    const we = Array.isArray(row.workout_exercise) ? row.workout_exercise[0] : row.workout_exercise;
    const exercise = we?.exercise ? (Array.isArray(we.exercise) ? we.exercise[0] : we.exercise) : null;
    const workout = we?.workout ? (Array.isArray(we.workout) ? we.workout[0] : we.workout) : null;
    return {
      athleteId: row.athlete_id,
      exerciseName: exercise?.name,
      workoutId: workout?.id,
      date: workout?.scheduled_date,
      weight: row.weight,
      reps: row.reps,
    };
  });

  const loggedWorkoutIds = new Set(
    normalizedLoggedSets.map((r) => r.workoutId).filter((id): id is string => !!id)
  );

  const completionByAthlete = buildWeeklyCompletion(weekWorkouts ?? [], loggedWorkoutIds);

  const evolutionRows = normalizedLoggedSets.filter(
    (r): r is { athleteId: string; exerciseName: string; workoutId: string; date: string; weight: number | null; reps: number | null } =>
      !!r.exerciseName && !!r.date && r.date >= monthStart && r.date <= monthEnd
  );

  const evolutionByAthlete = buildMonthlyEvolution(evolutionRows);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Reports</h1>
        <SendReportButton week={week} month={month} />
      </div>

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
            Workouts completed — week of {week}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/coach/reports?week=${addDays(week, -7)}&month=${month}`}
              className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800"
            >
              ← Prev week
            </Link>
            <Link
              href={`/coach/reports?week=${addDays(week, 7)}&month=${month}`}
              className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800"
            >
              Next week →
            </Link>
          </div>
        </div>

        {athletes.length === 0 ? (
          <p className="text-neutral-400">No athletes on your roster yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {athletes.map((a) => {
              const c = completionByAthlete.get(a.id) ?? { scheduled: 0, completed: 0 };
              return (
                <li key={a.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-white">{a.full_name}</span>
                  <span className="text-sm text-neutral-400">
                    {c.completed} / {c.scheduled} completed
                    {c.scheduled > 0 && (
                      <span className="ml-2 text-neutral-500">
                        ({Math.round((c.completed / c.scheduled) * 100)}%)
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
            Evolution — {formatMonthLabel(month)}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/coach/reports?week=${week}&month=${shiftMonth(month, -1)}`}
              className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800"
            >
              ← Prev month
            </Link>
            <Link
              href={`/coach/reports?week=${week}&month=${shiftMonth(month, 1)}`}
              className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800"
            >
              Next month →
            </Link>
          </div>
        </div>

        {athletes.every((a) => !evolutionByAthlete.has(a.id)) ? (
          <p className="text-neutral-400">
            Not enough logged sets this month to show evolution yet — need at least two different days logged
            per exercise.
          </p>
        ) : (
          <div className="space-y-6">
            {athletes
              .filter((a) => evolutionByAthlete.has(a.id))
              .map((a) => (
                <div key={a.id}>
                  <h3 className="mb-2 text-white">{a.full_name}</h3>
                  <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
                    {evolutionByAthlete.get(a.id)!.map((e) => (
                      <li key={e.exerciseName} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white">{e.exerciseName}</span>
                          <span className="text-sm text-neutral-500">
                            {e.firstDate} → {e.lastDate}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-neutral-400">
                          Weight: {e.firstWeight ?? "–"} → {e.lastWeight ?? "–"}
                          {e.firstWeight != null && e.lastWeight != null && (
                            <span
                              className={
                                e.lastWeight - e.firstWeight > 0
                                  ? "ml-1 text-emerald-400"
                                  : e.lastWeight - e.firstWeight < 0
                                    ? "ml-1 text-red-400"
                                    : "ml-1 text-neutral-500"
                              }
                            >
                              ({e.lastWeight - e.firstWeight > 0 ? "+" : ""}
                              {e.lastWeight - e.firstWeight})
                            </span>
                          )}
                          <span className="mx-2 text-neutral-700">·</span>
                          Reps: {e.firstReps ?? "–"} → {e.lastReps ?? "–"}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
