import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const fullName: string | undefined = body.fullName;
  const reusable: boolean = !!body.reusable;

  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (callerProfile?.role !== "coach") {
    return NextResponse.json({ error: "Only coaches can invite athletes." }, { status: 403 });
  }

  const admin = createAdminClient();

  if (reusable) {
    // Only one active team link per coach — expire any existing one so old
    // copies of it (e.g. in a group chat history) stop working.
    await admin
      .from("athlete_invites")
      .update({ expires_at: new Date().toISOString() })
      .eq("coach_id", caller.id)
      .eq("is_reusable", true)
      .gt("expires_at", new Date().toISOString());
  }

  const tenYearsFromNow = new Date();
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

  const { data: invite, error } = await admin
    .from("athlete_invites")
    .insert({
      coach_id: caller.id,
      full_name: reusable ? null : fullName || null,
      is_reusable: reusable,
      ...(reusable ? { expires_at: tenYearsFromNow.toISOString() } : {}),
    })
    .select("token")
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: error?.message ?? "Could not create invite." }, { status: 400 });
  }

  return NextResponse.json({ token: invite.token });
}
