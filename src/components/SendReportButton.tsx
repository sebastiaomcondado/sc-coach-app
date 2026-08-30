"use client";

import { useState } from "react";

export function SendReportButton({ week, month }: { week: string; month: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/reports/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week, month }),
    });
    const body = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Could not send report.");
      return;
    }
    setMessage("Report emailed.");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className="rounded-md border border-neutral-700 px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Email me this report"}
      </button>
      {message && <span className="text-sm text-emerald-400">{message}</span>}
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}
