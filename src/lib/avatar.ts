import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Avatars live in a private bucket — always resolve to a short-lived signed
// URL server-side rather than storing/using a permanent public link.
export async function getAvatarUrl(
  supabase: SupabaseClient<Database>,
  photoPath: string | null
): Promise<string | null> {
  if (!photoPath) return null;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(photoPath, 3600);
  return data?.signedUrl ?? null;
}
