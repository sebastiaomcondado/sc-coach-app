import { createAdminClient } from "@/lib/supabase/admin";
import { JoinCoachForm } from "@/components/JoinCoachForm";

export default async function JoinCoachPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("coach_invites")
    .select("*, owner:profiles!coach_invites_team_owner_id_fkey(full_name)")
    .eq("token", token)
    .single();

  const owner = invite ? (Array.isArray(invite.owner) ? invite.owner[0] : invite.owner) : null;

  const invalidReason = !invite
    ? "This invite link isn't valid."
    : invite.used_at
      ? "This invite link has already been used."
      : new Date(invite.expires_at) < new Date()
        ? "This invite link has expired."
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        {invalidReason ? (
          <>
            <h1 className="mb-2 text-2xl font-semibold text-white">Link not valid</h1>
            <p className="text-neutral-400">{invalidReason} Ask the coach to send you a new one.</p>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-semibold text-white">
              Join {owner?.full_name}&apos;s team
            </h1>
            <p className="mb-6 text-sm text-neutral-400">
              Set up your account to share the same roster, workouts, and templates.
            </p>
            <JoinCoachForm token={token} />
          </>
        )}
      </div>
    </div>
  );
}
