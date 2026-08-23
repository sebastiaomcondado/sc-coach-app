"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function randomPassword() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
}

export default function NewAthletePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(randomPassword());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/athletes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    const body = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      return;
    }

    setCreated({ email, password });
  }

  if (created) {
    return (
      <div className="max-w-md">
        <h1 className="mb-4 text-xl font-semibold text-white">Athlete added</h1>
        <p className="mb-4 text-neutral-300">
          Share these login details with {fullName} — they should change their password after
          logging in for the first time.
        </p>
        <div className="mb-6 space-y-1 rounded-md border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm text-emerald-400">
          <div>Email: {created.email}</div>
          <div>Password: {created.password}</div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/coach")}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Back to roster
          </button>
          <button
            onClick={() => {
              setCreated(null);
              setFullName("");
              setEmail("");
              setPassword(randomPassword());
            }}
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-xl font-semibold text-white">Add an athlete</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Temporary password</label>
          <input
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-white outline-none focus:border-emerald-500"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Pre-filled with a random password — feel free to change it.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add athlete"}
        </button>
      </form>
    </div>
  );
}
