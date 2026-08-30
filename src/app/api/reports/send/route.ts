import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { buildReportData, renderReportHtml, sendReportEmail } from "@/lib/reportEmail";

export async function POST(request: Request) {
  const { week, month } = await request.json();

  if (!week || !month) {
    return NextResponse.json({ error: "Missing week or month." }, { status: 400 });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (profile.role !== "coach") {
    return NextResponse.json({ error: "Only coaches can email reports." }, { status: 403 });
  }

  const recipient = process.env.REPORT_RECIPIENT_EMAIL;
  if (!recipient) {
    return NextResponse.json({ error: "REPORT_RECIPIENT_EMAIL not configured." }, { status: 500 });
  }

  const supabase = await createClient();
  const data = await buildReportData(supabase, profile.id, week, month);
  const html = renderReportHtml(data);

  const result = await sendReportEmail(recipient, html, `Weekly report — week of ${week}`);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ sent: true });
}
