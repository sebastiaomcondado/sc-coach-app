"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const POSITIONS = [
  "",
  "Prop",
  "Hooker",
  "Lock",
  "Flanker",
  "Number 8",
  "Scrum-half",
  "Fly-half",
  "Centre",
  "Wing",
  "Fullback",
];

export type ProfileFormValues = {
  fullName: string;
  photoUrl: string | null;
  dateOfBirth: string;
  position: string;
  heightCm: string;
  weightKg: string;
  jerseyNumber: string;
  squad: string;
};

export function ProfileForm({
  athleteId,
  initial,
  redirectTo,
  squadSuggestions = ["Forwards", "Backs"],
}: {
  athleteId: string;
  initial: ProfileFormValues;
  redirectTo: string;
  squadSuggestions?: string[];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.fullName);
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth);
  const [position, setPosition] = useState(initial.position);
  const [heightCm, setHeightCm] = useState(initial.heightCm);
  const [weightKg, setWeightKg] = useState(initial.weightKg);
  const [jerseyNumber, setJerseyNumber] = useState(initial.jerseyNumber);
  const [squad, setSquad] = useState(initial.squad);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial.photoUrl);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    let photoPath: string | undefined;

    if (photoFile) {
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
      photoPath = path;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        date_of_birth: dateOfBirth || null,
        position: position || null,
        height_cm: heightCm ? Number(heightCm) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        jersey_number: jerseyNumber ? Number(jerseyNumber) : null,
        squad: squad || null,
        ...(photoPath ? { photo_path: photoPath } : {}),
      })
      .eq("id", athleteId);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="mb-1 block text-sm text-neutral-300">Photo</label>
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

      <div>
        <label className="mb-1 block text-sm text-neutral-300">Full name</label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Date of birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p || "—"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Height (cm)</label>
          <input
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Weight (kg)</label>
          <input
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Jersey number</label>
          <input
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Group</label>
          <input
            value={squad}
            onChange={(e) => setSquad(e.target.value)}
            placeholder="e.g. Forwards"
            list="squad-suggestions"
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
          <datalist id="squad-suggestions">
            {squadSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
