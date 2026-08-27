"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAthleteButton({ athleteId, athleteName }: { athleteId: string; athleteName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`Permanently delete ${athleteName}? This cannot be undone.`)) return;

    setError(null);
    setLoading(true);

    const res = await fetch("/api/athletes/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteIds: [athleteId] }),
    });
    const body = await res.json();

    setLoading(false);

    if (!res.ok || body.deleted === 0) {
      setError(body.error ?? "Could not delete athlete.");
      return;
    }

    router.push("/coach");
    router.refresh();
  }

  return (
    <div className="mt-8 rounded-lg border border-red-900 p-4">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-red-400">Danger zone</h2>
      <p className="mb-3 text-sm text-neutral-400">
        Permanently deletes this athlete&apos;s account and all their data. This cannot be undone.
      </p>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-md border border-red-900 px-3 py-2 text-sm text-red-400 hover:bg-red-950 disabled:opacity-50"
      >
        {loading ? "Deleting…" : "Delete athlete"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
