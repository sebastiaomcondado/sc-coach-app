"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function BodyMetricsForm({ athleteId }: { athleteId: string }) {
  const router = useRouter();
  const [loggedDate, setLoggedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bodyweight, setBodyweight] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [readiness, setReadiness] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("body_metrics").upsert(
      {
        athlete_id: athleteId,
        logged_date: loggedDate,
        bodyweight_kg: bodyweight ? Number(bodyweight) : null,
        sleep_hours: sleepHours ? Number(sleepHours) : null,
        readiness: readiness ? Number(readiness) : null,
        notes: notes || null,
      },
      { onConflict: "athlete_id,logged_date" }
    );

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
    setBodyweight("");
    setSleepHours("");
    setReadiness("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Date</label>
          <input
            type="date"
            value={loggedDate}
            onChange={(e) => setLoggedDate(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Bodyweight (kg)</label>
          <input
            value={bodyweight}
            onChange={(e) => setBodyweight(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Sleep (hrs)</label>
          <input
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Readiness (1–10)</label>
          <input
            value={readiness}
            onChange={(e) => setReadiness(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Log today"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}
