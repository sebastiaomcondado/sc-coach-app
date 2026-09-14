import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, team_owner_id")
    .eq("id", caller.id)
    .single();

  if (callerProfile?.role !== "coach") {
    return NextResponse.json({ error: "Only coaches can invite co-coaches." }, { status: 403 });
  }
  if (callerProfile.team_owner_id !== null) {
    return NextResponse.json(
      { error: "Only the team owner can invite a co-coach." },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  const { data: invite, error } = await admin
    .from("coach_invites")
    .insert({ team_owner_id: caller.id })
    .select("token")
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: error?.message ?? "Could not create invite." }, { status: 400 });
  }

  return NextResponse.json({ token: invite.token });
}
