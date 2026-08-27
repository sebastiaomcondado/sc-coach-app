import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";

export async function POST(request: Request) {
  const { athleteIds } = await request.json();

  if (!Array.isArray(athleteIds) || athleteIds.length === 0) {
    return NextResponse.json({ error: "No athletes selected." }, { status: 400 });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (profile.role !== "coach") {
    return NextResponse.json({ error: "Only coaches can delete athletes." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: links } = await supabase
    .from("coach_athletes")
    .select("athlete_id")
    .eq("coach_id", profile.id)
    .in("athlete_id", athleteIds);

  const confirmedIds = (links ?? []).map((l) => l.athlete_id);

  if (confirmedIds.length === 0) {
    return NextResponse.json({ error: "No matching athletes on your roster." }, { status: 400 });
  }

  const admin = createAdminClient();
  let deleted = 0;
  const failed: string[] = [];

  for (const athleteId of confirmedIds) {
    const { error } = await admin.auth.admin.deleteUser(athleteId);
    if (error) {
      failed.push(athleteId);
    } else {
      deleted++;
    }
  }

  return NextResponse.json({ deleted, failed });
}
