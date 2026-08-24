import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { buildProgressSeries, buildPersonalRecords } from "@/lib/progress";
import { WorkoutLogger, type ExerciseBlock } from "@/components/WorkoutLogger";

export default async function AthleteWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: workout } = await supabase
    .from("workouts")
    .select("id, title, notes, scheduled_date")
    .eq("id", workoutId)
    .single();

  if (!workout) notFound();

  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select(
      "id, prescribed_sets, prescribed_reps, prescribed_weight, prescribed_rpe, prescribed_rest, section, superset_group, notes, position, exercise:exercises(name, video_url)"
    )
    .eq("workout_id", workoutId)
    .order("position");

  const [{ data: loggedSets }, { data: allLoggedSets }] = await Promise.all([
    supabase
      .from("logged_sets")
      .select("workout_exercise_id, set_number, reps, weight, rpe")
      .eq("athlete_id", profile!.id),
    supabase
      .from("logged_sets")
      .select(
        "weight, workout_exercise:workout_exercises(exercise:exercises(name), workout:workouts(scheduled_date))"
      )
      .eq("athlete_id", profile!.id),
  ]);

  const series = buildProgressSeries(
    (allLoggedSets ?? []).map((row) => ({
      weight: row.weight,
      workout_exercise: Array.isArray(row.workout_exercise)
        ? row.workout_exercise[0] ?? null
        : row.workout_exercise,
    }))
  );
  const priorBests = new Map(buildPersonalRecords(series).map((pr) => [pr.exerciseName, pr.weight]));

  const blocks: ExerciseBlock[] = (workoutExercises ?? []).map((we) => {
    const exercise = Array.isArray(we.exercise) ? we.exercise[0] : we.exercise;
    const exerciseName = exercise?.name ?? "Exercise";
    return {
      workoutExerciseId: we.id,
      exerciseName,
      videoUrl: exercise?.video_url ?? null,
      section: we.section,
      supersetGroup: we.superset_group,
      prescribedSets: we.prescribed_sets,
      prescribedReps: we.prescribed_reps,
      prescribedWeight: we.prescribed_weight,
      prescribedRpe: we.prescribed_rpe,
      prescribedRest: we.prescribed_rest,
      notes: we.notes,
      priorBest: priorBests.get(exerciseName) ?? null,
      loggedSets: (loggedSets ?? [])
        .filter((s) => s.workout_exercise_id === we.id)
        .map((s) => ({ setNumber: s.set_number, reps: s.reps, weight: s.weight, rpe: s.rpe })),
    };
  });

  return (
    <div>
      <Link href="/athlete" className="mb-4 inline-block text-sm text-neutral-400 hover:text-white">
        ← My workouts
      </Link>
      <h1 className="text-xl font-semibold text-white">{workout.title}</h1>
      <p className="mb-6 text-sm text-neutral-500">{workout.scheduled_date}</p>
      {workout.notes && <p className="mb-6 text-neutral-300">{workout.notes}</p>}

      <WorkoutLogger athleteId={profile!.id} blocks={blocks} />
    </div>
  );
}
