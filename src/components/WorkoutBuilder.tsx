"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Athlete = { id: string; full_name: string };
type Exercise = { id: string; name: string; category: string | null };
type Template = { id: string; name: string };

type Row = {
  exerciseId: string;
  sets: string;
  reps: string;
  weight: string;
  rpe: string;
  notes: string;
};

function emptyRow(defaultExerciseId: string): Row {
  return { exerciseId: defaultExerciseId, sets: "3", reps: "5", weight: "", rpe: "", notes: "" };
}

export function WorkoutBuilder({
  athletes,
  exercises,
  templates,
}: {
  athletes: Athlete[];
  exercises: Exercise[];
  templates: Template[];
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

  async function applyTemplate(id: string) {
    setTemplateId(id);
    if (!id) return;

    setTemplateLoading(true);
    const supabase = createClient();
    const { data: templateExercises, error: fetchError } = await supabase
      .from("template_exercises")
      .select("exercise_id, sets, reps, weight, rpe, notes")
      .eq("template_id", id)
      .order("position");
    setTemplateLoading(false);

    if (fetchError || !templateExercises) {
      setError(fetchError?.message ?? "Could not load template.");
      return;
    }

    setRows(
      templateExercises.map((te) => ({
        exerciseId: te.exercise_id,
        sets: te.sets?.toString() ?? "",
        reps: te.reps ?? "",
        weight: te.weight?.toString() ?? "",
        rpe: te.rpe?.toString() ?? "",
        notes: te.notes ?? "",
      }))
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
          prescribed_sets: row.sets ? Number(row.sets) : null,
          prescribed_reps: row.reps || null,
          prescribed_weight: row.weight ? Number(row.weight) : null,
          prescribed_rpe: row.rpe ? Number(row.rpe) : null,
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
            <div
              key={index}
              className="grid grid-cols-2 gap-2 rounded-md border border-neutral-800 p-3 sm:grid-cols-6"
            >
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
