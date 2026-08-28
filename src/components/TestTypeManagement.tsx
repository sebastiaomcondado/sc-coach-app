"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TestType = { id: string; name: string; unit: string; higher_is_better: boolean; coach_id: string | null };

function duplicateNameError(error: { code?: string; message: string } | null, name: string): string | null {
  if (!error) return null;
  if (error.code === "23505") return `"${name}" already exists.`;
  return error.message;
}

export function TestTypeManagement({ coachId, initialTestTypes }: { coachId: string; initialTestTypes: TestType[] }) {
  const router = useRouter();
  const [testTypes, setTestTypes] = useState(initialTestTypes);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [higherIsBetter, setHigherIsBetter] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const customTests = testTypes.filter((t) => t.coach_id === coachId);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedUnit = unit.trim();
    if (!trimmedName || !trimmedUnit) return;

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("test_types")
      .insert({ coach_id: coachId, name: trimmedName, unit: trimmedUnit, higher_is_better: higherIsBetter })
      .select("id, name, unit, higher_is_better, coach_id")
      .single();

    setLoading(false);

    const dupError = duplicateNameError(error, trimmedName);
    if (dupError) {
      setError(dupError);
      return;
    }
    if (data) {
      setTestTypes((prev) => [...prev, data]);
      setName("");
      setUnit("");
      setHigherIsBetter(true);
      router.refresh();
    }
  }

  async function handleDelete(testType: TestType) {
    if (
      !window.confirm(
        `Delete "${testType.name}"? All logged results for this test will be deleted too. This cannot be undone.`
      )
    )
      return;

    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("test_types").delete().eq("id", testType.id);

    if (error) {
      setError(error.message);
      return;
    }
    setTestTypes((prev) => prev.filter((t) => t.id !== testType.id));
    router.refresh();
  }

  return (
    <div>
      {customTests.length > 0 && (
        <ul className="mb-4 divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {customTests.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-white">
                {t.name} <span className="text-sm text-neutral-500">({t.unit}, {t.higher_is_better ? "higher" : "lower"} is better)</span>
              </span>
              <button
                type="button"
                onClick={() => handleDelete(t)}
                className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-red-400 hover:bg-neutral-800"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Beep Test"
            className="w-40 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Unit</label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. level"
            className="w-28 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Direction</label>
          <select
            value={higherIsBetter ? "higher" : "lower"}
            onChange={(e) => setHigherIsBetter(e.target.value === "higher")}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
          >
            <option value="higher">Higher is better</option>
            <option value="lower">Lower is better</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Adding…" : "+ Add custom test"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
