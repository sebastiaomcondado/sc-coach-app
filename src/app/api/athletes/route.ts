import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { fullName, email, password } = await request.json();

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: "Missing fullName, email, or password." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
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
    .select("role")
    .eq("id", caller.id)
    .single();

  if (callerProfile?.role !== "coach") {
    return NextResponse.json({ error: "Only coaches can add athletes." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create athlete account." },
      { status: 400 }
    );
  }

  const athleteId = created.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: athleteId,
    full_name: fullName,
    role: "athlete",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(athleteId);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { error: linkError } = await admin.from("coach_athletes").insert({
    coach_id: caller.id,
    athlete_id: athleteId,
  });

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  return NextResponse.json({ athleteId });
}
