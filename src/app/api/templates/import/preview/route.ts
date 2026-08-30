import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSheetRows, parseFlatTemplateRows } from "@/lib/sheetImport";

export async function POST(request: Request) {
  const { sheetUrl, tabName } = await request.json();

  if (!sheetUrl || !tabName) {
    return NextResponse.json({ error: "Missing sheetUrl or tabName." }, { status: 400 });
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
    return NextResponse.json({ error: "Only coaches can import templates." }, { status: 403 });
  }

  let rows: string[][];
  try {
    rows = await fetchSheetRows(sheetUrl, tabName);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read the sheet." },
      { status: 400 }
    );
  }

  let parsed;
  try {
    parsed = parseFlatTemplateRows(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not parse the sheet." },
      { status: 400 }
    );
  }

  return NextResponse.json(parsed);
}
