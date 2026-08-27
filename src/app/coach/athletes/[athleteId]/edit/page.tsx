import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatar";
import { ProfileForm } from "@/components/ProfileForm";
import { DeleteAthleteButton } from "@/components/DeleteAthleteButton";

export default async function EditAthletePage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", athleteId)
    .single();

  if (!athlete) notFound();

  const photoUrl = await getAvatarUrl(supabase, athlete.photo_path);

  const { data: groups } = await supabase
    .from("squad_groups")
    .select("id, name")
    .eq("coach_id", profile!.id)
    .order("name");

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
        isCoachEditing
        groups={groups ?? []}
        initial={{
          fullName: athlete.full_name,
          photoUrl,
          dateOfBirth: athlete.date_of_birth ?? "",
          position: athlete.position ?? "",
          heightCm: athlete.height_cm?.toString() ?? "",
          weightKg: athlete.weight_kg?.toString() ?? "",
          jerseyNumber: athlete.jersey_number?.toString() ?? "",
          squadGroupId: athlete.squad_group_id ?? "",
        }}
      />
      <div className="max-w-md">
        <DeleteAthleteButton athleteId={athleteId} athleteName={athlete.full_name} />
      </div>
    </div>
  );
}
