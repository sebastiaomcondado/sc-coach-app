"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Athlete = { id: string; full_name: string };
type Exercise = { id: string; name: string; category: string | null };
type Template = { id: string; name: string };

type PhaseOption = { label: string; sets: string; reps: string; rpe: string; rest: string };

type Row = {
  exerciseId: string;
  section: string;
  supersetGroup: string;
  sets: string;
  reps: string;
  weight: string;
  rpe: string;
  rest: string;
  notes: string;
  phaseOptions: PhaseOption[];
  selectedPhase: number;
};

function emptyRow(defaultExerciseId: string): Row {
  return {
    exerciseId: defaultExerciseId,
    section: "",
    supersetGroup: "",
    sets: "3",
    reps: "5",
    weight: "",
    rpe: "",
    rest: "",
    notes: "",
    phaseOptions: [],
    selectedPhase: 0,
  };
}

export function WorkoutBuilder({
  athletes,
  exercises,
  templates,
  initialTemplateId,
}: {
  athletes: Athlete[];
  exercises: Exercise[];
  templates: Template[];
  initialTemplateId?: string;
}) {
  const router = useRouter();
  const [athleteIds, setAthleteIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>(exercises.length ? [emptyRow(exercises[0].id)] : []);
  const [templateId, setTemplateId] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialTemplateId) applyTemplate(initialTemplateId);
  }, [initialTemplateId]);

  async function applyTemplate(id: string) {
    setTemplateId(id);
    if (!id) return;

    setTemplateLoading(true);
    const supabase = createClient();
    const { data: templateExercises, error: fetchError } = await supabase
      .from("template_exercises")
      .select("id, exercise_id, section, superset_group, weight, notes")
      .eq("template_id", id)
      .order("position");

    if (fetchError || !templateExercises) {
      setTemplateLoading(false);
      setError(fetchError?.message ?? "Could not load template.");
      return;
    }

    const { data: phases, error: phasesError } = await supabase
      .from("template_exercise_phases")
      .select("*")
      .in(
        "template_exercise_id",
        templateExercises.map((te) => te.id)
      )
      .order("position");
    setTemplateLoading(false);

    if (phasesError) {
      setError(phasesError.message);
      return;
    }

    setRows(
      templateExercises.map((te) => {
        const tePhases = (phases ?? [])
          .filter((p) => p.template_exercise_id === te.id)
          .map((p) => ({
            label: p.label ?? "",
            sets: p.sets?.toString() ?? "",
            reps: p.reps ?? "",
            rpe: p.rpe?.toString() ?? "",
            rest: p.rest ?? "",
          }));
        const first = tePhases[0];
        return {
          exerciseId: te.exercise_id,
          section: te.section ?? "",
          supersetGroup: te.superset_group ?? "",
          sets: first?.sets ?? "",
          reps: first?.reps ?? "",
          weight: te.weight?.toString() ?? "",
          rpe: first?.rpe ?? "",
          rest: first?.rest ?? "",
          notes: te.notes ?? "",
          phaseOptions: tePhases,
          selectedPhase: 0,
        };
      })
    );
  }

  function selectPhase(rowIndex: number, phaseIndex: number) {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r;
        const phase = r.phaseOptions[phaseIndex];
        if (!phase) return r;
        return {
          ...r,
          selectedPhase: phaseIndex,
          sets: phase.sets,
          reps: phase.reps,
          rpe: phase.rpe,
          rest: phase.rest,
        };
      })
    );
  }

  function toggleAthlete(id: string) {
    setAthleteIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(exercises[0]?.id ?? "")]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (athleteIds.length === 0) {
      setError("Pick at least one athlete.");
      return;
    }
    if (rows.length === 0) {
      setError("Add at least one exercise.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError("Not signed in.");
      return;
    }

    for (const athleteId of athleteIds) {
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          coach_id: user.id,
          athlete_id: athleteId,
          title,
          notes: notes || null,
          scheduled_date: scheduledDate,
        })
        .select()
        .single();

      if (workoutError || !workout) {
        setLoading(false);
        setError(workoutError?.message ?? "Could not create workout.");
        return;
      }

      const { error: exercisesError } = await supabase.from("workout_exercises").insert(
        rows.map((row, index) => ({
          workout_id: workout.id,
          exercise_id: row.exerciseId,
          position: index,
          section: row.section || null,
          superset_group: row.supersetGroup || null,
          prescribed_sets: row.sets ? Number(row.sets) : null,
          prescribed_reps: row.reps || null,
          prescribed_weight: row.weight ? Number(row.weight) : null,
          prescribed_rpe: row.rpe ? Number(row.rpe) : null,
          prescribed_rest: row.rest || null,
          notes: row.notes || null,
        }))
      );

      if (exercisesError) {
        setLoading(false);
        setError(exercisesError.message);
        return;
      }
    }

    setLoading(false);
    router.push("/coach");
    router.refresh();
  }

  if (exercises.length === 0) {
    return (
      <p className="text-neutral-400">
        Add at least one exercise to your library before building a workout.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm text-neutral-300">Assign to</label>
        {athletes.length === 0 ? (
          <p className="text-sm text-neutral-500">No athletes on your roster yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {athletes.map((a) => (
              <button
                type="button"
                key={a.id}
                onClick={() => toggleAthlete(a.id)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  athleteIds.includes(a.id)
                    ? "border-emerald-500 bg-emerald-600/20 text-emerald-300"
                    : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                {a.full_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Week 3 – Lower Body"
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Date</label>
          <input
            type="date"
            required
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-300">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
        />
      </div>

      {templates.length > 0 && (
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Start from template (optional)</label>
          <select
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
            disabled={templateLoading}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
          >
            <option value="">— None —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm text-neutral-300">Exercises</label>
          <button
            type="button"
            onClick={addRow}
            className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
          >
            + Add exercise
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="rounded-md border border-neutral-800 p-3">
              {(row.section || row.supersetGroup) && (
                <div className="mb-2 text-xs text-neutral-500">
                  {[row.section, row.supersetGroup].filter(Boolean).join(" · ")}
                </div>
              )}
              {row.phaseOptions.length > 1 && (
                <div className="mb-2">
                  <select
                    value={row.selectedPhase}
                    onChange={(e) => selectPhase(index, Number(e.target.value))}
                    className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-white"
                  >
                    {row.phaseOptions.map((p, i) => (
                      <option key={i} value={i}>
                        {p.label || `Phase ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                <select
                  value={row.exerciseId}
                  onChange={(e) => updateRow(index, { exerciseId: e.target.value })}
                  className="col-span-2 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white sm:col-span-2"
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Sets"
                  value={row.sets}
                  onChange={(e) => updateRow(index, { sets: e.target.value })}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                />
                <input
                  placeholder="Reps"
                  value={row.reps}
                  onChange={(e) => updateRow(index, { reps: e.target.value })}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                />
                <input
                  placeholder="Weight"
                  value={row.weight}
                  onChange={(e) => updateRow(index, { weight: e.target.value })}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                />
                <div className="flex gap-2">
                  <input
                    placeholder="RPE"
                    value={row.rpe}
                    onChange={(e) => updateRow(index, { rpe: e.target.value })}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="px-2 text-neutral-500 hover:text-red-400"
                    aria-label="Remove exercise"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
                <input
                  placeholder="Section (optional)"
                  value={row.section}
                  onChange={(e) => updateRow(index, { section: e.target.value })}
                  className="col-span-2 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white sm:col-span-2"
                />
                <input
                  placeholder="Superset (optional)"
                  value={row.supersetGroup}
                  onChange={(e) => updateRow(index, { supersetGroup: e.target.value })}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                />
                <input
                  placeholder="Rest (optional)"
                  value={row.rest}
                  onChange={(e) => updateRow(index, { rest: e.target.value })}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Assigning…" : "Assign workout"}
      </button>
    </form>
  );
}
