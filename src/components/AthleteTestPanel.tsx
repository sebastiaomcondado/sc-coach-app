"use client";

import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { estimateOneRm, bestResult, ONE_RM_TEST_NAME_TO_CATEGORY } from "@/lib/tests";

type TestType = { id: string; name: string; unit: string; higher_is_better: boolean };
type TestResult = { id: string; test_type_id: string; value: number; logged_date: string };
type Suggestion = { value: number; source: string };

export function AthleteTestPanel({
  athleteId,
  testTypes,
  initialResults,
  readOnly,
  oneRmSuggestions,
}: {
  athleteId: string;
  testTypes: TestType[];
  initialResults: TestResult[];
  readOnly: boolean;
  oneRmSuggestions?: Record<string, Suggestion>;
}) {
  const [results, setResults] = useState(initialResults);
  const [selectedId, setSelectedId] = useState(testTypes[0]?.id ?? "");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [calcWeight, setCalcWeight] = useState("");
  const [calcReps, setCalcReps] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDate, setEditDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = testTypes.find((t) => t.id === selectedId);
  const testResults = useMemo(
    () =>
      results
        .filter((r) => r.test_type_id === selectedId)
        .sort((a, b) => a.logged_date.localeCompare(b.logged_date)),
    [results, selectedId]
  );
  const best = selected ? bestResult(testResults, selected.higher_is_better) : null;
  const suggestion = selected ? oneRmSuggestions?.[selected.id] : undefined;
  const isOneRmTest = !!selected && !!ONE_RM_TEST_NAME_TO_CATEGORY[selected.name];
  const calcEstimate = calcWeight && calcReps ? estimateOneRm(Number(calcWeight), Number(calcReps)) : null;

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !value) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("test_results")
      .insert({ test_type_id: selected.id, athlete_id: athleteId, value: Number(value), logged_date: date })
      .select("id, test_type_id, value, logged_date")
      .single();

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data) {
      setResults((prev) => [...prev, data]);
      setValue("");
    }
  }

  async function handleSaveEdit(resultId: string) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("test_results")
      .update({ value: Number(editValue), logged_date: editDate })
      .eq("id", resultId);

    if (error) {
      setError(error.message);
      return;
    }
    setResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, value: Number(editValue), logged_date: editDate } : r))
    );
    setEditingId(null);
  }

  async function handleDelete(resultId: string) {
    if (!window.confirm("Delete this result?")) return;
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("test_results").delete().eq("id", resultId);
    if (error) {
      setError(error.message);
      return;
    }
    setResults((prev) => prev.filter((r) => r.id !== resultId));
  }

  if (testTypes.length === 0) {
    return <p className="text-neutral-400">No test types yet.</p>;
  }

  return (
    <div>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="mb-4 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
      >
        {testTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {testResults.length === 0 ? (
        <p className="mb-4 text-neutral-400">No results yet.</p>
      ) : (
        <>
          <div className="mb-4 h-56 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={testResults.map((r) => ({ date: r.logged_date, value: r.value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#171717", border: "1px solid #404040", fontSize: 12 }}
                  labelStyle={{ color: "#fafafa" }}
                />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ul className="mb-4 divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {[...testResults].reverse().map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                {editingId === r.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white"
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(r.id)}
                      className="rounded-md bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={r.id === best?.id ? "font-medium text-emerald-400" : "text-white"}>
                      {r.value} {selected?.unit}
                      {r.id === best?.id && " (PB)"}
                    </span>
                    <span className="text-sm text-neutral-500">{r.logged_date}</span>
                  </>
                )}
                {!readOnly && editingId !== r.id && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(r.id);
                        setEditValue(String(r.value));
                        setEditDate(r.logged_date);
                      }}
                      className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-red-400 hover:bg-neutral-800"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {!readOnly && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          {isOneRmTest && (
            <div className="mb-3 space-y-2 border-b border-neutral-800 pb-3">
              {suggestion && (
                <p className="text-sm text-neutral-300">
                  Suggested from logged sets:{" "}
                  <span className="font-medium text-emerald-400">{suggestion.value.toFixed(1)} kg</span> (
                  {suggestion.source}){" "}
                  <button
                    type="button"
                    onClick={() => setValue(suggestion.value.toFixed(1))}
                    className="ml-1 text-emerald-400 hover:underline"
                  >
                    Use this
                  </button>
                </p>
              )}
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="mb-1 block text-xs text-neutral-400">Calculator: weight</label>
                  <input
                    type="number"
                    step="any"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(e.target.value)}
                    className="w-20 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-neutral-400">reps</label>
                  <input
                    type="number"
                    value={calcReps}
                    onChange={(e) => setCalcReps(e.target.value)}
                    className="w-16 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white"
                  />
                </div>
                {calcEstimate != null && (
                  <p className="text-sm text-neutral-300">
                    ≈ <span className="font-medium text-white">{calcEstimate.toFixed(1)} kg</span>{" "}
                    <button
                      type="button"
                      onClick={() => setValue(calcEstimate.toFixed(1))}
                      className="text-emerald-400 hover:underline"
                    >
                      Use this
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLog} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Value ({selected?.unit})</label>
              <input
                required
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-28 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Date</label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? "Logging…" : "Log result"}
            </button>
          </form>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
