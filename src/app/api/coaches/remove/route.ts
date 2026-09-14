import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { coachId } = await request.json();

  if (!coachId) {
    return NextResponse.json({ error: "Missing coachId." }, { status: 400 });
  }

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

  if (callerProfile?.role !== "coach" || callerProfile.team_owner_id !== null) {
    return NextResponse.json({ error: "Only the team owner can remove a co-coach." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("id, team_owner_id")
    .eq("id", coachId)
    .single();

  if (!target || target.team_owner_id !== caller.id) {
    return NextResponse.json({ error: "That coach isn't on your team." }, { status: 400 });
  }

  const { error } = await admin.auth.admin.deleteUser(coachId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
