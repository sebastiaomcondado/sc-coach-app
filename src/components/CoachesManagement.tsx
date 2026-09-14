"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TeamMember = { id: string; fullName: string; isOwner: boolean };

export function CoachesManagement({
  team,
  isOwner,
  currentUserId,
}: {
  team: TeamMember[];
  isOwner: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(team);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generateInvite() {
    setGenerating(true);
    setError(null);

    const res = await fetch("/api/coach-invites", { method: "POST" });
    const body = await res.json();

    setGenerating(false);

    if (!res.ok) {
      setError(body.error ?? "Could not create invite.");
      return;
    }

    setLink(`${window.location.origin}/join-coach/${body.token}`);
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function removeCoach(member: TeamMember) {
    if (!window.confirm(`Remove ${member.fullName}? Their account will be permanently deleted.`)) return;

    setError(null);
    setRemovingId(member.id);

    const res = await fetch("/api/coaches/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId: member.id }),
    });
    const body = await res.json();

    setRemovingId(null);

    if (!res.ok) {
      setError(body.error ?? "Could not remove coach.");
      return;
    }

    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">Team</h2>
        <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-white">
                {m.fullName}
                {m.id === currentUserId && <span className="ml-2 text-sm text-neutral-500">(you)</span>}
                {m.isOwner && <span className="ml-2 text-sm text-neutral-500">Owner</span>}
              </span>
              {isOwner && !m.isOwner && (
                <button
                  type="button"
                  onClick={() => removeCoach(m)}
                  disabled={removingId === m.id}
                  className="rounded-md border border-red-900 px-2 py-1 text-xs text-red-400 hover:bg-red-950 disabled:opacity-50"
                >
                  {removingId === m.id ? "Removing…" : "Remove"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isOwner && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">
            Invite a co-coach
          </h2>
          <p className="mb-3 text-sm text-neutral-400">
            One-time link that lets someone create an account and immediately share your roster,
            workouts, and templates.
          </p>

          {link && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 p-3">
              <code className="flex-1 truncate text-sm text-emerald-400">{link}</code>
              <button
                onClick={copyLink}
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={generateInvite}
            disabled={generating}
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
          >
            {generating ? "Generating…" : link ? "Generate new link" : "Create invite link"}
          </button>
        </section>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
