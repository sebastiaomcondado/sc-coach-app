"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Cycle = { id: string; name: string };

export function ImportTemplateForm({ cycles }: { cycles: Cycle[] }) {
  const router = useRouter();
  const [templateName, setTemplateName] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [tabName, setTabName] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ exercisesImported: number; exercisesCreated: number } | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/templates/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateName, sheetUrl, tabName, cycleId, notes }),
    });
    const body = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      return;
    }

    setResult(body);
  }

  if (result) {
    return (
      <div className="max-w-lg">
        <h1 className="mb-4 text-xl font-semibold text-white">Template imported</h1>
        <p className="mb-6 text-neutral-300">
          Imported <span className="text-white">{result.exercisesImported}</span> exercise rows
          {result.exercisesCreated > 0 && (
            <>
              {" "}
              — <span className="text-white">{result.exercisesCreated}</span> new exercise
              {result.exercisesCreated === 1 ? "" : "s"} added to your library
            </>
          )}
          .
        </p>
        <div className="flex gap-3">
          <Link
            href="/coach/templates"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            View templates
          </Link>
          <button
            onClick={() => {
              router.refresh();
              setResult(null);
              setTemplateName("");
              setSheetUrl("");
              setTabName("");
              setCycleId("");
              setNotes("");
            }}
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            Import another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-2 text-xl font-semibold text-white">Import from Google Sheets</h1>
      <p className="mb-6 text-sm text-neutral-400">
        The sheet must be shared as <span className="text-neutral-300">&quot;anyone with the link
        can view&quot;</span>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Template name</label>
          <input
            required
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Google Sheets link</label>
          <input
            required
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Tab name</label>
          <input
            required
            value={tabName}
            onChange={(e) => setTabName(e.target.value)}
            placeholder="e.g. Ficha 1 Wide"
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>
        {cycles.length > 0 && (
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
        )}
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Importing…" : "Import"}
        </button>
      </form>

      <div className="mt-10 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <h2 className="mb-2 text-sm font-medium text-white">Expected column format</h2>
        <p className="mb-3 text-sm text-neutral-400">
          The tab&apos;s first row should be a header with any of these column names (only{" "}
          <span className="text-neutral-300">Exercise</span> is required). One row = one exercise
          phase — give an exercise multiple rows with the same Section/Group/Exercise to create
          progressions (e.g. different weeks). Merged cells work fine; blank Section/Group/
          Exercise/Video/Category cells fill down from the row above.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs text-neutral-400">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-300">
                <th className="py-1 pr-3">Section</th>
                <th className="py-1 pr-3">Group</th>
                <th className="py-1 pr-3">Exercise</th>
                <th className="py-1 pr-3">Video</th>
                <th className="py-1 pr-3">Category</th>
                <th className="py-1 pr-3">Phase</th>
                <th className="py-1 pr-3">Sets</th>
                <th className="py-1 pr-3">Reps</th>
                <th className="py-1 pr-3">RPE</th>
                <th className="py-1 pr-3">Rest</th>
                <th className="py-1">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-900">
                <td className="py-1 pr-3">Lower Body</td>
                <td className="py-1 pr-3">A</td>
                <td className="py-1 pr-3">Back Squat</td>
                <td className="py-1 pr-3">youtube.com/...</td>
                <td className="py-1 pr-3">Lower Body</td>
                <td className="py-1 pr-3">Week 1-3</td>
                <td className="py-1 pr-3">3</td>
                <td className="py-1 pr-3">8-10</td>
                <td className="py-1 pr-3">8</td>
                <td className="py-1 pr-3">1&apos;</td>
                <td className="py-1"></td>
              </tr>
              <tr>
                <td className="py-1 pr-3"></td>
                <td className="py-1 pr-3"></td>
                <td className="py-1 pr-3"></td>
                <td className="py-1 pr-3"></td>
                <td className="py-1 pr-3"></td>
                <td className="py-1 pr-3">Week 4-6</td>
                <td className="py-1 pr-3">4</td>
                <td className="py-1 pr-3">4-6</td>
                <td className="py-1 pr-3">8</td>
                <td className="py-1 pr-3">1&apos;</td>
                <td className="py-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
