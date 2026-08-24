import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { fullName, email, password, squad } = await request.json();

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: "Missing fullName, email, or password." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("athlete_invites")
    .select("*")
    .eq("token", token)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "This invite link isn't valid." }, { status: 404 });
  }
  if (!invite.is_reusable && invite.used_at) {
    return NextResponse.json({ error: "This invite link has already been used." }, { status: 400 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite link has expired." }, { status: 400 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "athlete" },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create your account." },
      { status: 400 }
    );
  }

  const athleteId = created.user.id;

  const { error: linkError } = await admin
    .from("coach_athletes")
    .insert({ coach_id: invite.coach_id, athlete_id: athleteId });

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  if (squad) {
    await admin.from("profiles").update({ squad }).eq("id", athleteId);
  }

  if (!invite.is_reusable) {
    await admin.from("athlete_invites").update({ used_at: new Date().toISOString() }).eq("token", token);
  }

  return NextResponse.json({ ok: true });
}
