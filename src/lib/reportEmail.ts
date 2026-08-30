import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  addDays,
  getMonthRange,
  formatMonthLabel,
  buildWeeklyCompletion,
  buildMonthlyEvolution,
  type WeeklyCompletion,
  type ExerciseEvolution,
} from "@/lib/reports";

export type ReportEmailData = {
  week: string;
  weekEnd: string;
  month: string;
  athletes: { id: string; full_name: string }[];
  completionByAthlete: Map<string, WeeklyCompletion>;
  evolutionByAthlete: Map<string, ExerciseEvolution[]>;
};

export async function buildReportData(
  supabase: SupabaseClient<Database>,
  coachId: string,
  week: string,
  month: string
): Promise<ReportEmailData> {
  const weekEnd = addDays(week, 6);
  const { start: monthStart, end: monthEnd } = getMonthRange(month);

  const [{ data: rosterRows }, { data: weekWorkouts }, { data: loggedSets }] = await Promise.all([
    supabase
      .from("coach_athletes")
      .select("athlete:profiles!coach_athletes_athlete_id_fkey(id, full_name)")
      .eq("coach_id", coachId),
    supabase
      .from("workouts")
      .select("id, athlete_id")
      .eq("coach_id", coachId)
      .gte("scheduled_date", week)
      .lte("scheduled_date", weekEnd),
    supabase
      .from("logged_sets")
      .select(
        "athlete_id, weight, reps, workout_exercise:workout_exercises(exercise:exercises(name), workout:workouts(id, scheduled_date))"
      ),
  ]);

  const athletes = (rosterRows ?? [])
    .map((r) => (Array.isArray(r.athlete) ? r.athlete[0] : r.athlete))
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
    (
      r
    ): r is { athleteId: string; exerciseName: string; workoutId: string; date: string; weight: number | null; reps: number | null } =>
      !!r.exerciseName && !!r.date && r.date >= monthStart && r.date <= monthEnd
  );

  const evolutionByAthlete = buildMonthlyEvolution(evolutionRows);

  return { week, weekEnd, month, athletes, completionByAthlete, evolutionByAthlete };
}

export function renderReportHtml(data: ReportEmailData): string {
  const { week, weekEnd, month, athletes, completionByAthlete, evolutionByAthlete } = data;

  if (athletes.length === 0) {
    return `<h1>Weekly report — week of ${week}</h1><p>Nothing to report this week — no athletes on your roster yet.</p>`;
  }

  const hasAnyScheduled = athletes.some((a) => (completionByAthlete.get(a.id)?.scheduled ?? 0) > 0);
  const hasAnyEvolution = athletes.some((a) => evolutionByAthlete.has(a.id));

  const completionSection = !hasAnyScheduled
    ? "<p>No workouts scheduled this week.</p>"
    : `<ul>${athletes
        .map((a) => {
          const c = completionByAthlete.get(a.id) ?? { scheduled: 0, completed: 0 };
          const pct = c.scheduled > 0 ? ` (${Math.round((c.completed / c.scheduled) * 100)}%)` : "";
          return `<li><strong>${a.full_name}</strong>: ${c.completed} / ${c.scheduled} completed${pct}</li>`;
        })
        .join("")}</ul>`;

  const evolutionSection = !hasAnyEvolution
    ? "<p>Not enough logged sets this month to show evolution yet.</p>"
    : athletes
        .filter((a) => evolutionByAthlete.has(a.id))
        .map((a) => {
          const rows = evolutionByAthlete
            .get(a.id)!
            .map((e) => {
              const weightChange =
                e.firstWeight != null && e.lastWeight != null
                  ? ` (${e.lastWeight - e.firstWeight > 0 ? "+" : ""}${e.lastWeight - e.firstWeight})`
                  : "";
              return `<li>${e.exerciseName}: weight ${e.firstWeight ?? "–"} → ${e.lastWeight ?? "–"}${weightChange}, reps ${
                e.firstReps ?? "–"
              } → ${e.lastReps ?? "–"} (${e.firstDate} → ${e.lastDate})</li>`;
            })
            .join("");
          return `<h3>${a.full_name}</h3><ul>${rows}</ul>`;
        })
        .join("");

  return `
    <h1>Weekly report — week of ${week} to ${weekEnd}</h1>
    <h2>Workouts completed</h2>
    ${completionSection}
    <h2>Evolution — ${formatMonthLabel(month)}</h2>
    ${evolutionSection}
  `;
}

export async function sendReportEmail(
  to: string,
  html: string,
  subject: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "S&C Coach <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body };
  }
  return { ok: true };
}
