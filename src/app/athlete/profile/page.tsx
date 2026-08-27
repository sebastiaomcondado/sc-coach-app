import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatar";
import { ProfileForm } from "@/components/ProfileForm";

export default async function AthleteProfilePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const photoUrl = await getAvatarUrl(supabase, profile!.photo_path);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">My profile</h1>
      <ProfileForm
        athleteId={profile!.id}
        redirectTo="/athlete"
        initial={{
          fullName: profile!.full_name,
          photoUrl,
          dateOfBirth: profile!.date_of_birth ?? "",
          position: profile!.position ?? "",
          heightCm: profile!.height_cm?.toString() ?? "",
          weightKg: profile!.weight_kg?.toString() ?? "",
          jerseyNumber: profile!.jersey_number?.toString() ?? "",
          squadGroupId: profile!.squad_group_id ?? "",
        }}
      />
    </div>
  );
}
