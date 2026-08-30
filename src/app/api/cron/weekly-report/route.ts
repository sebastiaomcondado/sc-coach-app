import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMostRecentMonday } from "@/lib/weekdays";
import { buildReportData, renderReportHtml, sendReportEmail } from "@/lib/reportEmail";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const coachId = process.env.REPORT_COACH_ID;
  const recipient = process.env.REPORT_RECIPIENT_EMAIL;
  if (!coachId || !recipient) {
    return NextResponse.json({ error: "REPORT_COACH_ID or REPORT_RECIPIENT_EMAIL not configured." }, { status: 500 });
  }

  const week = getMostRecentMonday();
  const month = new Date().toISOString().slice(0, 7);

  const admin = createAdminClient();
  const data = await buildReportData(admin, coachId, week, month);
  const html = renderReportHtml(data);

  const result = await sendReportEmail(recipient, html, `Weekly report — week of ${week}`);

  if (!result.ok) {
    return NextResponse.json({ sent: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ sent: true });
}
