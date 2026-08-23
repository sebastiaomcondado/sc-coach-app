"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Exercise = { id: string; name: string; category: string | null };

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

export function TemplateBuilder({ exercises }: { exercises: Exercise[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>(exercises.length ? [emptyRow(exercises[0].id)] : []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    const { data: template, error: templateError } = await supabase
      .from("program_templates")
      .insert({ coach_id: user.id, name, notes: notes || null })
      .select()
      .single();

    if (templateError || !template) {
      setLoading(false);
      setError(templateError?.message ?? "Could not create template.");
      return;
    }

    const { error: exercisesError } = await supabase.from("template_exercises").insert(
      rows.map((row, index) => ({
        template_id: template.id,
        exercise_id: row.exerciseId,
        position: index,
        sets: row.sets ? Number(row.sets) : null,
        reps: row.reps || null,
        weight: row.weight ? Number(row.weight) : null,
        rpe: row.rpe ? Number(row.rpe) : null,
        notes: row.notes || null,
      }))
    );

    setLoading(false);

    if (exercisesError) {
      setError(exercisesError.message);
      return;
    }

    router.push("/coach/templates");
    router.refresh();
  }

  if (exercises.length === 0) {
    return (
      <p className="text-neutral-400">
        Add at least one exercise to your library before building a template.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1 block text-sm text-neutral-300">Template name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lower Body A"
          className="w-full max-w-md rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-300">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full max-w-md rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
        />
      </div>

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
                placeholder="Weight (optional)"
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
        {loading ? "Saving…" : "Save template"}
      </button>
    </form>
  );
}
