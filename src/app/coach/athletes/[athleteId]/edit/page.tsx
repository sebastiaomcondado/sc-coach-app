import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAvatarUrl } from "@/lib/avatar";
import { ProfileForm } from "@/components/ProfileForm";

export default async function EditAthletePage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", athleteId)
    .single();

  if (!athlete) notFound();

  const photoUrl = await getAvatarUrl(supabase, athlete.photo_path);

  return (
    <div>
      <Link
        href={`/coach/athletes/${athleteId}`}
        className="mb-4 inline-block text-sm text-neutral-400 hover:text-white"
      >
        ← {athlete.full_name}
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-white">Edit profile</h1>
      <ProfileForm
        athleteId={athleteId}
        redirectTo={`/coach/athletes/${athleteId}`}
        initial={{
          fullName: athlete.full_name,
          photoUrl,
          dateOfBirth: athlete.date_of_birth ?? "",
          position: athlete.position ?? "",
          heightCm: athlete.height_cm?.toString() ?? "",
          weightKg: athlete.weight_kg?.toString() ?? "",
          jerseyNumber: athlete.jersey_number?.toString() ?? "",
          squad: athlete.squad ?? "",
        }}
      />
    </div>
  );
}
