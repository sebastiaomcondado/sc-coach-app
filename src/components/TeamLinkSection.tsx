"use client";

import { useState } from "react";

export function TeamLinkSection({ initialLink }: { initialLink: string | null }) {
  const [link, setLink] = useState(initialLink);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reusable: true }),
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

  return (
    <div>
      <p className="mb-3 text-sm text-neutral-400">
        One link anyone can use — paste it into your squad&apos;s WhatsApp group and everyone joins with
        their own email and password.
      </p>

      {link ? (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 p-3">
          <code className="flex-1 truncate text-sm text-emerald-400">{link}</code>
          <button
            onClick={copyLink}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      ) : null}

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
      >
        {loading ? "Generating…" : link ? "Generate new link (invalidates this one)" : "Create team link"}
      </button>
    </div>
  );
}
