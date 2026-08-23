import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
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
      "id, prescribed_sets, prescribed_reps, prescribed_weight, prescribed_rpe, notes, position, exercise:exercises(name)"
    )
    .eq("workout_id", workoutId)
    .order("position");

  const { data: loggedSets } = await supabase
    .from("logged_sets")
    .select("workout_exercise_id, set_number, reps, weight, rpe")
    .eq("athlete_id", profile!.id);

  const blocks: ExerciseBlock[] = (workoutExercises ?? []).map((we) => {
    const exercise = Array.isArray(we.exercise) ? we.exercise[0] : we.exercise;
    return {
      workoutExerciseId: we.id,
      exerciseName: exercise?.name ?? "Exercise",
      prescribedSets: we.prescribed_sets,
      prescribedReps: we.prescribed_reps,
      prescribedWeight: we.prescribed_weight,
      prescribedRpe: we.prescribed_rpe,
      notes: we.notes,
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
