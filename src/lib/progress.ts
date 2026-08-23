import type { ExerciseSeries } from "@/components/ProgressChart";

type LoggedSetRow = {
  weight: number | null;
  workout_exercise: {
    exercise: { name: string } | null;
    workout: { scheduled_date: string } | null;
  } | null;
};

// Reduces raw logged_sets rows into one line-chart series per exercise,
// using the best (highest) weight logged on each session date.
export function buildProgressSeries(rows: LoggedSetRow[]): ExerciseSeries[] {
  const byExercise = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const exerciseName = row.workout_exercise?.exercise?.name;
    const date = row.workout_exercise?.workout?.scheduled_date;
    if (!exerciseName || !date || row.weight == null) continue;

    if (!byExercise.has(exerciseName)) byExercise.set(exerciseName, new Map());
    const byDate = byExercise.get(exerciseName)!;
    const existing = byDate.get(date);
    if (existing == null || row.weight > existing) byDate.set(date, row.weight);
  }

  return Array.from(byExercise.entries())
    .map(([exerciseName, byDate]) => ({
      exerciseName,
      points: Array.from(byDate.entries())
        .map(([date, weight]) => ({ date, weight }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}
