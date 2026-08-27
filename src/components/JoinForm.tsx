"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function JoinForm({
  token,
  initialFullName,
  groups,
}: {
  token: string;
  initialFullName: string;
  groups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "photo">("details");
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [squadGroupId, setSquadGroupId] = useState("");
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/invites/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, squadGroupId }),
    });
    const body = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(body.error ?? "Could not create your account.");
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setAthleteId(body.athleteId);
    setStep("photo");
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handlePhotoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!photoFile || !athleteId) {
      setError("Add a photo so your coach can recognize you.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const ext = photoFile.name.split(".").pop() || "jpg";
    const path = `${athleteId}/photo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, photoFile, { upsert: true });

    if (uploadError) {
      setLoading(false);
      setError(uploadError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ photo_path: path })
      .eq("id", athleteId);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace("/athlete/profile");
    router.refresh();
  }

  if (step === "photo") {
    return (
      <form onSubmit={handlePhotoSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Add a photo</label>
          <p className="mb-3 text-sm text-neutral-500">
            So your coach can tell who&apos;s who on the roster.
          </p>
          <div className="flex items-center gap-4">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt=""
                className="h-16 w-16 rounded-full object-cover border border-neutral-700"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-neutral-800 border border-neutral-700" />
            )}
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm text-neutral-300" />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Finish"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleDetailsSubmit} className="space-y-4">
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
        <label className="mb-1 block text-sm text-neutral-300">Choose a password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-300">Group</label>
        <select
          required
          value={squadGroupId}
          onChange={(e) => setSquadGroupId(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
        >
          <option value="" disabled>
            — Choose a group —
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Setting up…" : "Continue"}
      </button>
    </form>
  );
}
