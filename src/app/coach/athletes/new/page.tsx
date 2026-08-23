import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { InviteAthleteForm } from "@/components/InviteAthleteForm";
import { TeamLinkSection } from "@/components/TeamLinkSection";

export default async function NewAthletePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("host");
  const origin = `${host?.includes("localhost") ? "http" : "https"}://${host}`;

  const { data: activeTeamLink } = await supabase
    .from("athlete_invites")
    .select("token")
    .eq("coach_id", profile!.id)
    .eq("is_reusable", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-md space-y-10">
      <section>
        <h1 className="mb-2 text-xl font-semibold text-white">Invite one athlete</h1>
        <p className="mb-6 text-sm text-neutral-400">
          Generates a link just for them — they pick their own email and password.
        </p>
        <InviteAthleteForm />
      </section>

      <section className="border-t border-neutral-800 pt-8">
        <h2 className="mb-2 text-xl font-semibold text-white">Team link</h2>
        <TeamLinkSection
          initialLink={activeTeamLink ? `${origin}/join/${activeTeamLink.token}` : null}
        />
      </section>
    </div>
  );
}
