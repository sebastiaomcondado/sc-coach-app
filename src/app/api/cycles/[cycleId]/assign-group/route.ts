import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

type TemplateExerciseRow = {
  id: string;
  exercise_id: string;
  position: number;
  section: string | null;
  superset_group: string | null;
  weight: number | null;
  notes: string | null;
};

type PhaseRow = {
  id: string;
  template_exercise_id: string;
  position: number;
  sets: number | null;
  reps: string | null;
  rpe: number | null;
  rest: string | null;
  start_week: number | null;
  end_week: number | null;
};

function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function resolvePhase(phases: PhaseRow[], weekNumber: number): PhaseRow | undefined {
  const matches = phases.filter(
    (p) =>
      (p.start_week === null || p.start_week <= weekNumber) &&
      (p.end_week === null || p.end_week >= weekNumber)
  );
  if (matches.length === 0) return phases[0];
  return matches.find((p) => p.start_week !== null && p.end_week !== null) ?? matches[0];
}

export async function POST(request: Request, { params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  const { squad } = await request.json();

  if (!squad) {
    return NextResponse.json({ error: "Pick a group." }, { status: 400 });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (profile.role !== "coach") {
    return NextResponse.json({ error: "Only coaches can assign cycles." }, { status: 403 });
  }

  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("training_cycles")
    .select("id, start_date, end_date")
    .eq("id", cycleId)
    .single();

  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }
  if (!cycle.start_date || !cycle.end_date) {
    return NextResponse.json(
      { error: "This cycle needs both a start and end date before you can auto-assign it." },
      { status: 400 }
    );
  }

  const { data: rosterRows } = await supabase
    .from("coach_athletes")
    .select("athlete:profiles!coach_athletes_athlete_id_fkey(id, squad)")
    .eq("coach_id", profile.id);

  const athleteIds = (rosterRows ?? [])
    .map((r) => r.athlete)
    .filter((a): a is { id: string; squad: string | null } => !!a)
    .filter((a) => a.squad === squad)
    .map((a) => a.id);

  if (athleteIds.length === 0) {
    return NextResponse.json({ error: "No athletes in that group." }, { status: 400 });
  }

  const { data: templates } = await supabase
    .from("program_templates")
    .select("id, name, day_of_week")
    .eq("cycle_id", cycleId);

  const schedulable = (templates ?? []).filter((t) => t.day_of_week !== null);
  const skippedTemplates = (templates ?? [])
    .filter((t) => t.day_of_week === null)
    .map((t) => ({ id: t.id, name: t.name }));

  if (schedulable.length === 0) {
    return NextResponse.json(
      { error: "No templates in this cycle have a day of week set.", skippedTemplates },
      { status: 400 }
    );
  }

  const start = parseDateOnly(cycle.start_date);
  const end = parseDateOnly(cycle.end_date);

  let created = 0;

  for (const template of schedulable) {
    const { data: templateExercises } = await supabase
      .from("template_exercises")
      .select("id, exercise_id, position, section, superset_group, weight, notes")
      .eq("template_id", template.id)
      .order("position");

    const exercises = (templateExercises ?? []) as TemplateExerciseRow[];
    if (exercises.length === 0) continue;

    const { data: phases } = await supabase
      .from("template_exercise_phases")
      .select("*")
      .in(
        "template_exercise_id",
        exercises.map((e) => e.id)
      )
      .order("position");

    const phasesByExercise = new Map<string, PhaseRow[]>();
    for (const p of (phases ?? []) as PhaseRow[]) {
      phasesByExercise.set(p.template_exercise_id, [
        ...(phasesByExercise.get(p.template_exercise_id) ?? []),
        p,
      ]);
    }

    for (let d = new Date(start); d.getTime() <= end.getTime(); d = new Date(d.getTime() + 86400000)) {
      if (d.getUTCDay() !== template.day_of_week) continue;

      const weekNumber = Math.floor((d.getTime() - start.getTime()) / (7 * 86400000)) + 1;
      const date = formatDateOnly(d);

      const { data: insertedWorkouts, error: workoutsError } = await supabase
        .from("workouts")
        .insert(
          athleteIds.map((athleteId) => ({
            coach_id: profile.id,
            athlete_id: athleteId,
            title: template.name,
            scheduled_date: date,
            cycle_id: cycleId,
          }))
        )
        .select("id, athlete_id");

      if (workoutsError || !insertedWorkouts) {
        return NextResponse.json(
          { error: workoutsError?.message ?? "Could not create workouts.", createdSoFar: created },
          { status: 400 }
        );
      }

      const workoutExerciseRows = insertedWorkouts.flatMap((workout) =>
        exercises.map((ex) => {
          const phase = resolvePhase(phasesByExercise.get(ex.id) ?? [], weekNumber);
          return {
            workout_id: workout.id,
            exercise_id: ex.exercise_id,
            position: ex.position,
            section: ex.section,
            superset_group: ex.superset_group,
            prescribed_sets: phase?.sets ?? null,
            prescribed_reps: phase?.reps ?? null,
            prescribed_weight: ex.weight,
            prescribed_rpe: phase?.rpe ?? null,
            prescribed_rest: phase?.rest ?? null,
            notes: ex.notes,
          };
        })
      );

      const { error: exercisesError } = await supabase.from("workout_exercises").insert(workoutExerciseRows);

      if (exercisesError) {
        return NextResponse.json(
          { error: exercisesError.message, createdSoFar: created + insertedWorkouts.length },
          { status: 400 }
        );
      }

      created += insertedWorkouts.length;
    }
  }

  return NextResponse.json({ created, athleteCount: athleteIds.length, skippedTemplates });
}
