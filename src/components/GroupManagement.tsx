"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Group = { id: string; name: string };
type Athlete = { id: string; full_name: string; squad_group_id: string | null };

function duplicateNameError(error: { code?: string; message: string } | null, name: string): string | null {
  if (!error) return null;
  if (error.code === "23505") return `"${name}" already exists.`;
  return error.message;
}

export function GroupManagement({
  coachId,
  initialGroups,
  initialAthletes,
}: {
  coachId: string;
  initialGroups: Group[];
  initialAthletes: Athlete[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [athletes, setAthletes] = useState(initialAthletes);
  const [newGroupName, setNewGroupName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const name = newGroupName.trim();
    if (!name) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("squad_groups")
      .insert({ coach_id: coachId, name })
      .select("id, name")
      .single();

    const dupError = duplicateNameError(error, name);
    if (dupError) {
      setError(dupError);
      return;
    }
    if (data) {
      setGroups((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewGroupName("");
    }
  }

  async function handleRename(groupId: string) {
    setError(null);
    setMessage(null);
    const name = renameValue.trim();
    if (!name) return;

    const supabase = createClient();
    const { error } = await supabase.from("squad_groups").update({ name }).eq("id", groupId);

    const dupError = duplicateNameError(error, name);
    if (dupError) {
      setError(dupError);
      return;
    }
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name } : g)).sort((a, b) => a.name.localeCompare(b.name))
    );
    setRenamingId(null);
  }

  async function handleDeleteGroup(group: Group) {
    if (!window.confirm(`Delete "${group.name}"? Athletes in it will become Unassigned.`)) return;

    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("squad_groups").delete().eq("id", group.id);

    if (error) {
      setError(error.message);
      return;
    }
    setGroups((prev) => prev.filter((g) => g.id !== group.id));
    setAthletes((prev) => prev.map((a) => (a.squad_group_id === group.id ? { ...a, squad_group_id: null } : a)));
  }

  async function handleMoveAthlete(athleteId: string, newGroupId: string) {
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ squad_group_id: newGroupId || null })
      .eq("id", athleteId);

    if (error) {
      setError(error.message);
      return;
    }
    setAthletes((prev) =>
      prev.map((a) => (a.id === athleteId ? { ...a, squad_group_id: newGroupId || null } : a))
    );
  }

  function toggleSelected(athleteId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(athleteId)) next.delete(athleteId);
      else next.add(athleteId);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Permanently delete ${selectedIds.size} athlete${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`
      )
    )
      return;

    setError(null);
    setMessage(null);
    setLoading(true);

    const res = await fetch("/api/athletes/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteIds: [...selectedIds] }),
    });
    const body = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Could not delete athletes.");
      return;
    }

    const deletedIds = new Set([...selectedIds].filter((id) => !body.failed?.includes(id)));
    setAthletes((prev) => prev.filter((a) => !deletedIds.has(a.id)));
    setSelectedIds(new Set());
    setMessage(`${body.deleted} athlete${body.deleted === 1 ? "" : "s"} deleted.`);
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">Groups</h2>
        <ul className="mb-4 divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {groups.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
              {renamingId === g.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleRename(g.id)}
                    className="rounded-md bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenamingId(null)}
                    className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span className="text-white">{g.name}</span>
              )}
              {renamingId !== g.id && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(g.id);
                      setRenameValue(g.name);
                    }}
                    className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(g)}
                    className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-red-400 hover:bg-neutral-800"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={handleCreateGroup} className="flex gap-2">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name"
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            + Add group
          </button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">Athletes</h2>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0 || loading}
            className="rounded-md border border-red-900 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950 disabled:opacity-50"
          >
            {loading ? "Deleting…" : `Delete selected (${selectedIds.size})`}
          </button>
        </div>

        {athletes.length === 0 ? (
          <p className="text-neutral-400">No athletes on your roster yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {athletes.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <label className="flex min-w-0 flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(a.id)}
                    onChange={() => toggleSelected(a.id)}
                    className="shrink-0"
                  />
                  <span className="truncate text-white">{a.full_name}</span>
                </label>
                <select
                  value={a.squad_group_id ?? ""}
                  onChange={(e) => handleMoveAthlete(a.id, e.target.value)}
                  className="shrink-0 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white"
                >
                  <option value="">Unassigned</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
