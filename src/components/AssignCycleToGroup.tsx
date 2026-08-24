"use client";

import Link from "next/link";
import { useState } from "react";

type Result = {
  created: number;
  athleteCount: number;
  skippedTemplates: { id: string; name: string }[];
};

export function AssignCycleToGroup({ cycleId, groups }: { cycleId: string; groups: string[] }) {
  const [group, setGroup] = useState(groups[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function handleAssign() {
    if (!group) return;
    if (
      !window.confirm(
        `This will create workouts for every athlete in "${group}" on every date in this cycle that matches a template's assigned day of week. This can't be undone. Continue?`
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch(`/api/cycles/${cycleId}/assign-group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ squad: group }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not assign this cycle.");
      if (data.skippedTemplates) {
        setResult({ created: 0, athleteCount: 0, skippedTemplates: data.skippedTemplates });
      }
      return;
    }

    setResult(data);
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Tag athletes with a group on the roster to enable assigning this cycle to a whole group.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-400">
        Assign this cycle to a group
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
        >
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAssign}
          disabled={loading}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Assigning…" : "Assign cycle"}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-3 text-sm text-neutral-300">
          {result.created > 0 && (
            <p>
              Created {result.created} workout{result.created === 1 ? "" : "s"} for {result.athleteCount}{" "}
              athlete{result.athleteCount === 1 ? "" : "s"}.
            </p>
          )}
          {result.skippedTemplates.length > 0 && (
            <div className="mt-1 text-amber-400">
              <p>Skipped (no day of week set):</p>
              <ul className="list-inside list-disc">
                {result.skippedTemplates.map((t) => (
                  <li key={t.id}>
                    <Link href={`/coach/templates/${t.id}/edit`} className="hover:underline">
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
