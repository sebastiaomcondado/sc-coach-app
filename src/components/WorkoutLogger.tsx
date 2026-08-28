"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkAndAwardBadges } from "@/lib/badges";

export type ExerciseBlock = {
  workoutExerciseId: string;
  exerciseName: string;
  videoUrl: string | null;
  section: string | null;
  supersetGroup: string | null;
  prescribedSets: number | null;
  prescribedReps: string | null;
  prescribedWeight: number | null;
  prescribedRpe: number | null;
  prescribedRest: string | null;
  notes: string | null;
  priorBest: number | null;
  loggedSets: { setNumber: number; reps: number | null; weight: number | null; rpe: number | null }[];
};

type SetInput = { reps: string; weight: string; rpe: string };

function initialSets(block: ExerciseBlock): SetInput[] {
  const count = Math.max(block.prescribedSets ?? 0, block.loggedSets.length, 1);
  return Array.from({ length: count }, (_, i) => {
    const existing = block.loggedSets.find((s) => s.setNumber === i + 1);
    return {
      reps: existing?.reps?.toString() ?? "",
      weight: existing?.weight?.toString() ?? "",
      rpe: existing?.rpe?.toString() ?? "",
    };
  });
}

export function WorkoutLogger({ athleteId, blocks }: { athleteId: string; blocks: ExerciseBlock[] }) {
  const router = useRouter();
  const [sets, setSets] = useState<Record<string, SetInput[]>>(() =>
    Object.fromEntries(blocks.map((b) => [b.workoutExerciseId, initialSets(b)]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [prId, setPrId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateSet(workoutExerciseId: string, index: number, patch: Partial<SetInput>) {
    setSavedId(null);
    setSets((prev) => ({
      ...prev,
      [workoutExerciseId]: prev[workoutExerciseId].map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  function addSet(workoutExerciseId: string) {
    setSets((prev) => ({
      ...prev,
      [workoutExerciseId]: [...prev[workoutExerciseId], { reps: "", weight: "", rpe: "" }],
    }));
  }

  async function saveExercise(workoutExerciseId: string) {
    setError(null);
    setSavingId(workoutExerciseId);
    setPrId(null);

    const supabase = createClient();
    const rows = sets[workoutExerciseId]
      .map((s, i) => ({
        workout_exercise_id: workoutExerciseId,
        athlete_id: athleteId,
        set_number: i + 1,
        reps: s.reps ? Number(s.reps) : null,
        weight: s.weight ? Number(s.weight) : null,
        rpe: s.rpe ? Number(s.rpe) : null,
      }))
      .filter((r) => r.reps !== null || r.weight !== null || r.rpe !== null);

    if (rows.length > 0) {
      const { error } = await supabase
        .from("logged_sets")
        .upsert(rows, { onConflict: "workout_exercise_id,athlete_id,set_number" });

      if (error) {
        setSavingId(null);
        setError(error.message);
        return;
      }
    }

    const block = blocks.find((b) => b.workoutExerciseId === workoutExerciseId);
    const weightsLogged = rows.map((r) => r.weight).filter((w): w is number => w != null);
    const bestJustLogged = weightsLogged.length > 0 ? Math.max(...weightsLogged) : null;
    const isPr = bestJustLogged != null && bestJustLogged > (block?.priorBest ?? 0);

    if (weightsLogged.length > 0) {
      await checkAndAwardBadges(supabase, athleteId, weightsLogged);
    }

    setSavingId(null);
    setSavedId(workoutExerciseId);
    if (isPr) setPrId(workoutExerciseId);
    router.refresh();
  }

  const sectionHeadingFor = blocks.map((block, i) => {
    const prevSection = i === 0 ? null : blocks[i - 1].section;
    return block.section && block.section !== prevSection;
  });

  return (
    <div className="space-y-6">
      {blocks.map((block, blockIndex) => {
        const showSectionHeading = sectionHeadingFor[blockIndex];

        return (
        <div key={block.workoutExerciseId}>
          {showSectionHeading && (
            <h2 className="mb-2 mt-2 text-sm font-medium uppercase tracking-wide text-neutral-400">
              {block.section}
            </h2>
          )}
          <div className="rounded-lg border border-neutral-800 p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-medium text-white">
              {block.supersetGroup && (
                <span className="mr-1.5 text-neutral-500">{block.supersetGroup}.</span>
              )}
              {block.exerciseName}
              {block.videoUrl && (
                <a
                  href={block.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 text-xs font-normal text-emerald-400 hover:underline"
                >
                  ▶ Watch
                </a>
              )}
            </h3>
            <span className="text-xs text-neutral-500">
              Target: {block.prescribedSets ?? "–"} x {block.prescribedReps ?? "–"}
              {block.prescribedWeight ? ` @ ${block.prescribedWeight}` : ""}
              {block.prescribedRpe ? ` (RPE ${block.prescribedRpe})` : ""}
              {block.prescribedRest ? ` · Rest ${block.prescribedRest}` : ""}
            </span>
          </div>
          {block.notes && <p className="mb-3 text-sm text-neutral-400">{block.notes}</p>}

          <div className="space-y-2">
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-xs text-neutral-500">
              <span>Set</span>
              <span>Reps</span>
              <span>Weight</span>
              <span>RPE</span>
            </div>
            {sets[block.workoutExerciseId].map((s, i) => (
              <div key={i} className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
                <span className="flex items-center text-sm text-neutral-400">{i + 1}</span>
                <input
                  value={s.reps}
                  onChange={(e) => updateSet(block.workoutExerciseId, i, { reps: e.target.value })}
                  className="w-full min-w-0 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                />
                <input
                  value={s.weight}
                  onChange={(e) => updateSet(block.workoutExerciseId, i, { weight: e.target.value })}
                  className="w-full min-w-0 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                />
                <input
                  value={s.rpe}
                  onChange={(e) => updateSet(block.workoutExerciseId, i, { rpe: e.target.value })}
                  className="w-full min-w-0 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => addSet(block.workoutExerciseId)}
              className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
            >
              + Add set
            </button>
            <button
              type="button"
              onClick={() => saveExercise(block.workoutExerciseId)}
              disabled={savingId === block.workoutExerciseId}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {savingId === block.workoutExerciseId ? "Saving…" : "Save"}
            </button>
            {savedId === block.workoutExerciseId && (
              <span className="text-sm text-emerald-400">Saved</span>
            )}
          </div>
          {prId === block.workoutExerciseId && (
            <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-400">
              🎉 New PR on {block.exerciseName}!
            </p>
          )}
          </div>
        </div>
        );
      })}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
