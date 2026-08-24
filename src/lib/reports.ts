// Date-only string helpers (YYYY-MM-DD), all UTC-based to match the rest of the app.

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d) + days * 86400000);
  return date.toISOString().slice(0, 10);
}

export function getMonthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Weekly workout completion, per athlete.

export type WeeklyCompletion = { scheduled: number; completed: number };

export function buildWeeklyCompletion(
  workouts: { id: string; athlete_id: string }[],
  loggedWorkoutIds: Set<string>
): Map<string, WeeklyCompletion> {
  const byAthlete = new Map<string, WeeklyCompletion>();
  for (const w of workouts) {
    const entry = byAthlete.get(w.athlete_id) ?? { scheduled: 0, completed: 0 };
    entry.scheduled += 1;
    if (loggedWorkoutIds.has(w.id)) entry.completed += 1;
    byAthlete.set(w.athlete_id, entry);
  }
  return byAthlete;
}

// Monthly evolution: first vs. last logged weight/reps per exercise, per athlete.

export type EvolutionRow = {
  athleteId: string;
  exerciseName: string;
  date: string;
  weight: number | null;
  reps: number | null;
};

export type ExerciseEvolution = {
  exerciseName: string;
  firstDate: string;
  lastDate: string;
  firstWeight: number | null;
  lastWeight: number | null;
  firstReps: number | null;
  lastReps: number | null;
};

export function buildMonthlyEvolution(rows: EvolutionRow[]): Map<string, ExerciseEvolution[]> {
  const byAthleteExercise = new Map<string, Map<string, Map<string, { weight: number | null; reps: number | null }>>>();

  for (const row of rows) {
    if (!byAthleteExercise.has(row.athleteId)) byAthleteExercise.set(row.athleteId, new Map());
    const byExercise = byAthleteExercise.get(row.athleteId)!;
    if (!byExercise.has(row.exerciseName)) byExercise.set(row.exerciseName, new Map());
    const byDate = byExercise.get(row.exerciseName)!;

    const existing = byDate.get(row.date);
    if (!existing || (row.weight ?? -Infinity) > (existing.weight ?? -Infinity)) {
      byDate.set(row.date, { weight: row.weight, reps: row.reps });
    }
  }

  const result = new Map<string, ExerciseEvolution[]>();
  for (const [athleteId, byExercise] of byAthleteExercise) {
    const evolutions: ExerciseEvolution[] = [];
    for (const [exerciseName, byDate] of byExercise) {
      const dates = [...byDate.keys()].sort();
      if (dates.length < 2) continue;
      const first = byDate.get(dates[0])!;
      const last = byDate.get(dates[dates.length - 1])!;
      evolutions.push({
        exerciseName,
        firstDate: dates[0],
        lastDate: dates[dates.length - 1],
        firstWeight: first.weight,
        lastWeight: last.weight,
        firstReps: first.reps,
        lastReps: last.reps,
      });
    }
    if (evolutions.length > 0) {
      evolutions.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
      result.set(athleteId, evolutions);
    }
  }
  return result;
}
