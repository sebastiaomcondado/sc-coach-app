import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

// Every coach-owned row's coach_id stores the TEAM OWNER's id, regardless of
// which team member actually created it — this is what lets an assistant
// coach see and act on the exact same data as the owner. A solo coach (or
// the owner themselves) is their own team owner.
export function getTeamOwnerId(profile: Profile): string {
  return profile.team_owner_id ?? profile.id;
}
