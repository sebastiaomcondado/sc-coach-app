import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCsv, parseFlatTemplateRows } from "@/lib/sheetImport";

function extractSheetId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function POST(request: Request) {
  const { templateName, notes, sheetUrl, tabName } = await request.json();

  if (!templateName || !sheetUrl || !tabName) {
    return NextResponse.json(
      { error: "Missing templateName, sheetUrl, or tabName." },
      { status: 400 }
    );
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

  const sheetId = extractSheetId(sheetUrl);
  if (!sheetId) {
    return NextResponse.json({ error: "That doesn't look like a Google Sheets URL." }, { status: 400 });
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    tabName
  )}`;

  const sheetRes = await fetch(csvUrl);
  if (!sheetRes.ok) {
    return NextResponse.json(
      {
        error:
          "Couldn't read that sheet. Make sure it's shared as \"anyone with the link can view\" and the tab name is exact.",
      },
      { status: 400 }
    );
  }

  const csvText = await sheetRes.text();
  let entries;
  try {
    entries = parseFlatTemplateRows(parseCsv(csvText));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not parse the sheet." },
      { status: 400 }
    );
  }

  if (entries.length === 0) {
    return NextResponse.json({ error: "No exercise rows found in that tab." }, { status: 400 });
  }

  const { data: template, error: templateError } = await supabase
    .from("program_templates")
    .insert({ coach_id: caller.id, name: templateName, notes: notes || null })
    .select()
    .single();

  if (templateError || !template) {
    return NextResponse.json(
      { error: templateError?.message ?? "Could not create template." },
      { status: 400 }
    );
  }

  const { data: existingExercises } = await supabase.from("exercises").select("id, name");
  const exerciseByName = new Map(
    (existingExercises ?? []).map((ex) => [ex.name.trim().toLowerCase(), ex.id])
  );

  let exercisesCreated = 0;

  for (const [index, entry] of entries.entries()) {
    let exerciseId = exerciseByName.get(entry.exerciseName.trim().toLowerCase());

    if (!exerciseId) {
      const { data: newExercise, error: newExerciseError } = await supabase
        .from("exercises")
        .insert({
          name: entry.exerciseName,
          video_url: entry.video || null,
          category: entry.category || null,
          created_by: caller.id,
        })
        .select()
        .single();

      if (newExerciseError || !newExercise) {
        return NextResponse.json(
          { error: newExerciseError?.message ?? `Could not create exercise "${entry.exerciseName}".` },
          { status: 400 }
        );
      }

      exerciseId = newExercise.id;
      exerciseByName.set(entry.exerciseName.trim().toLowerCase(), exerciseId);
      exercisesCreated++;
    }

    const { data: templateExercise, error: templateExerciseError } = await supabase
      .from("template_exercises")
      .insert({
        template_id: template.id,
        exercise_id: exerciseId,
        position: index,
        section: entry.section || null,
        superset_group: entry.supersetGroup || null,
        notes: entry.notes || null,
      })
      .select()
      .single();

    if (templateExerciseError || !templateExercise) {
      return NextResponse.json(
        { error: templateExerciseError?.message ?? "Could not save an exercise row." },
        { status: 400 }
      );
    }

    const { error: phasesError } = await supabase.from("template_exercise_phases").insert(
      entry.phases.map((phase, phaseIndex) => ({
        template_exercise_id: templateExercise.id,
        label: phase.label || null,
        position: phaseIndex,
        sets: phase.sets ? Number(phase.sets) : null,
        reps: phase.reps || null,
        rpe: phase.rpe ? Number(phase.rpe) : null,
        rest: phase.rest || null,
      }))
    );

    if (phasesError) {
      return NextResponse.json({ error: phasesError.message }, { status: 400 });
    }
  }

  return NextResponse.json({
    templateId: template.id,
    exercisesImported: entries.length,
    exercisesCreated,
  });
}
