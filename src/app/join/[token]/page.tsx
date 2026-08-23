import { createAdminClient } from "@/lib/supabase/admin";
import { JoinForm } from "@/components/JoinForm";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("athlete_invites")
    .select("*, coach:profiles!athlete_invites_coach_id_fkey(full_name)")
    .eq("token", token)
    .single();

  const coach = invite ? (Array.isArray(invite.coach) ? invite.coach[0] : invite.coach) : null;

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
            <p className="text-neutral-400">{invalidReason} Ask your coach to send you a new one.</p>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-semibold text-white">Join {coach?.full_name}&apos;s squad</h1>
            <p className="mb-6 text-sm text-neutral-400">
              Set up your account to see your workouts and log your training.
            </p>
            <JoinForm token={token} initialFullName={invite!.full_name ?? ""} />
          </>
        )}
      </div>
    </div>
  );
}
