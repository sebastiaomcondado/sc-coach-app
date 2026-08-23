"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewAthletePage() {
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName }),
    });
    const body = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      return;
    }

    setLink(`${window.location.origin}/join/${body.token}`);
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (link) {
    return (
      <div className="max-w-md">
        <h1 className="mb-4 text-xl font-semibold text-white">Invite link ready</h1>
        <p className="mb-4 text-neutral-300">
          Send this link to {fullName || "your athlete"} — they&apos;ll set up their own account and
          password, and land straight on the profile page.
        </p>
        <div className="mb-4 flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 p-3">
          <code className="flex-1 truncate text-sm text-emerald-400">{link}</code>
          <button
            onClick={copyLink}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mb-6 text-xs text-neutral-500">Expires in 14 days, or once they use it.</p>
        <div className="flex gap-3">
          <Link
            href="/coach"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Back to roster
          </Link>
          <button
            onClick={() => {
              setLink(null);
              setFullName("");
            }}
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            Invite another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-2 text-xl font-semibold text-white">Invite an athlete</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Generates a link you send them directly — they pick their own email and password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Full name (optional)</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Leave blank and they can fill it in themselves"
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate invite link"}
        </button>
      </form>
    </div>
  );
}
