import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Creates coach accounts pre-confirmed, bypassing Supabase's email
// confirmation flow entirely (and its free-tier email rate limit) — the
// same admin-creation pattern used for athletes in /api/athletes.
export async function POST(request: Request) {
  const { fullName, email, password } = await request.json();

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: "Missing fullName, email, or password." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "coach" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
