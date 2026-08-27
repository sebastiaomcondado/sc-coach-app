"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WEEKDAY_NAMES } from "@/lib/weekdays";

type Cycle = { id: string; name: string };
type Exercise = { id: string; name: string; category: string | null; video_url: string | null };

type Phase = {
  label: string;
  sets: string;
  reps: string;
  rpe: string;
  rest: string;
  startWeek: string;
  endWeek: string;
};

type Row = {
  exerciseId: string;
  section: string;
  supersetGroup: string;
  weight: string;
  notes: string;
  phases: Phase[];
};

export type TemplateFormValues = {
  name: string;
  notes: string;
  cycleId: string;
  dayOfWeek: string;
};

function emptyPhase(): Phase {
  return { label: "", sets: "3", reps: "5", rpe: "", rest: "", startWeek: "", endWeek: "" };
}

function emptyRow(defaultExerciseId: string): Row {
  return {
    exerciseId: defaultExerciseId,
    section: "",
    supersetGroup: "",
    weight: "",
    notes: "",
    phases: [emptyPhase()],
  };
}

export function EditTemplateForm({
  templateId,
  cycles,
  exercises,
  initialRows,
  initial,
}: {
  templateId: string;
  cycles: Cycle[];
  exercises: Exercise[];
  initialRows: Row[];
  initial: TemplateFormValues;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [notes, setNotes] = useState(initial.notes);
  const [cycleId, setCycleId] = useState(initial.cycleId);
  const [dayOfWeek, setDayOfWeek] = useState(initial.dayOfWeek);
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
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

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
  }

  function updatePhase(rowIndex: number, phaseIndex: number, patch: Partial<Phase>) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex
          ? { ...r, phases: r.phases.map((p, j) => (j === phaseIndex ? { ...p, ...patch } : p)) }
          : r
      )
    );
  }

  function addPhase(rowIndex: number) {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, phases: [...r.phases, emptyPhase()] } : r))
    );
  }

  function removePhase(rowIndex: number, phaseIndex: number) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex ? { ...r, phases: r.phases.filter((_, j) => j !== phaseIndex) } : r
      )
    );
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

    const { error: updateError } = await supabase
      .from("program_templates")
      .update({
        name,
        notes: notes || null,
        cycle_id: cycleId || null,
        day_of_week: dayOfWeek === "" ? null : Number(dayOfWeek),
      })
      .eq("id", templateId);

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    // Exercises/phases are replaced wholesale rather than diffed — simpler,
    // and safe because workouts already assigned from this template store
    // their own independent copy of the exercise data (no FK back here), so
    // this never touches anything already assigned.
    const { error: deleteError } = await supabase
      .from("template_exercises")
      .delete()
      .eq("template_id", templateId);

    if (deleteError) {
      setLoading(false);
      setError(deleteError.message);
      return;
    }

    const { data: insertedExercises, error: exercisesError } = await supabase
      .from("template_exercises")
      .insert(
        rows.map((row, index) => ({
          template_id: templateId,
          exercise_id: row.exerciseId,
          position: index,
          section: row.section || null,
          superset_group: row.supersetGroup || null,
          weight: row.weight ? Number(row.weight) : null,
          notes: row.notes || null,
        }))
      )
      .select();

    if (exercisesError || !insertedExercises) {
      setLoading(false);
      setError(exercisesError?.message ?? "Could not save exercises.");
      return;
    }

    const phaseRows = rows.flatMap((row, rowIndex) =>
      row.phases.map((phase, phaseIndex) => ({
        template_exercise_id: insertedExercises[rowIndex].id,
        label: phase.label || null,
        position: phaseIndex,
        sets: phase.sets ? Number(phase.sets) : null,
        reps: phase.reps || null,
        rpe: phase.rpe ? Number(phase.rpe) : null,
        rest: phase.rest || null,
        start_week: phase.startWeek ? Number(phase.startWeek) : null,
        end_week: phase.endWeek ? Number(phase.endWeek) : null,
      }))
    );

    const { error: phasesError } = await supabase.from("template_exercise_phases").insert(phaseRows);

    setLoading(false);

    if (phasesError) {
      setError(phasesError.message);
      return;
    }

    router.push(`/coach/templates/${templateId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1 block text-sm text-neutral-300">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
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
      <div className="grid max-w-md grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Cycle (optional)</label>
          <select
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
          >
            <option value="">— None —</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Day of week (optional)</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
          >
            <option value="">— None —</option>
            {WEEKDAY_NAMES.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
        </div>
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

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className={`rounded-md border border-neutral-800 p-3 ${dragIndex === index ? "opacity-50" : ""}`}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                <span
                  className="col-span-2 flex cursor-move items-center justify-center rounded-md border border-neutral-700 text-neutral-500 sm:col-span-1"
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                >
                  ⠿
                </span>
                <div className="col-span-2 flex items-center gap-2">
                  <select
                    value={row.exerciseId}
                    onChange={(e) => updateRow(index, { exerciseId: e.target.value })}
                    className="w-full min-w-0 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                  >
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                  {exercises.find((ex) => ex.id === row.exerciseId)?.video_url && (
                    <a
                      href={exercises.find((ex) => ex.id === row.exerciseId)!.video_url!}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs text-emerald-400 hover:underline"
                    >
                      ▶
                    </a>
                  )}
                </div>
                <input
                  placeholder="Section (e.g. Warm Up)"
                  value={row.section}
                  onChange={(e) => updateRow(index, { section: e.target.value })}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                />
                <input
                  placeholder="Superset (e.g. A1)"
                  value={row.supersetGroup}
                  onChange={(e) => updateRow(index, { supersetGroup: e.target.value })}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                />
                <div className="flex gap-2">
                  <input
                    placeholder="Weight (optional)"
                    value={row.weight}
                    onChange={(e) => updateRow(index, { weight: e.target.value })}
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
              <input
                placeholder="Notes (optional)"
                value={row.notes}
                onChange={(e) => updateRow(index, { notes: e.target.value })}
                className="mt-2 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
              />

              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-7 gap-2 text-xs text-neutral-500">
                  <span>Phase label</span>
                  <span>Sets</span>
                  <span>Reps</span>
                  <span>RPE</span>
                  <span>Rest</span>
                  <span>Start wk</span>
                  <span>End wk</span>
                </div>
                {row.phases.map((phase, phaseIndex) => (
                  <div key={phaseIndex} className="grid grid-cols-7 gap-2">
                    <input
                      placeholder="e.g. Week 1-3"
                      value={phase.label}
                      onChange={(e) => updatePhase(index, phaseIndex, { label: e.target.value })}
                      className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                    />
                    <input
                      value={phase.sets}
                      onChange={(e) => updatePhase(index, phaseIndex, { sets: e.target.value })}
                      className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                    />
                    <input
                      value={phase.reps}
                      onChange={(e) => updatePhase(index, phaseIndex, { reps: e.target.value })}
                      className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                    />
                    <input
                      value={phase.rpe}
                      onChange={(e) => updatePhase(index, phaseIndex, { rpe: e.target.value })}
                      className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                    />
                    <input
                      value={phase.rest}
                      onChange={(e) => updatePhase(index, phaseIndex, { rest: e.target.value })}
                      className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                    />
                    <input
                      placeholder="e.g. 1"
                      value={phase.startWeek}
                      onChange={(e) => updatePhase(index, phaseIndex, { startWeek: e.target.value })}
                      className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        placeholder="e.g. 3"
                        value={phase.endWeek}
                        onChange={(e) => updatePhase(index, phaseIndex, { endWeek: e.target.value })}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                      />
                      {row.phases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhase(index, phaseIndex)}
                          className="px-1 text-neutral-500 hover:text-red-400"
                          aria-label="Remove phase"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addPhase(index)}
                  className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                >
                  + Add phase (e.g. a later week&apos;s progression)
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
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
