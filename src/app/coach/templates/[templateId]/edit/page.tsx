import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { EditTemplateForm } from "@/components/EditTemplateForm";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: template }, { data: cycles }, { data: exercises }, { data: templateExercises }] =
    await Promise.all([
      supabase
        .from("program_templates")
        .select("id, name, notes, cycle_id, day_of_week")
        .eq("id", templateId)
        .single(),
      supabase.from("training_cycles").select("id, name").eq("coach_id", profile!.id).order("name"),
      supabase.from("exercises").select("id, name, category, video_url").order("name"),
      supabase
        .from("template_exercises")
        .select("id, exercise_id, section, superset_group, weight, notes")
        .eq("template_id", templateId)
        .order("position"),
    ]);

  if (!template) notFound();

  const { data: phases } = await supabase
    .from("template_exercise_phases")
    .select("*")
    .in("template_exercise_id", (templateExercises ?? []).map((te) => te.id))
    .order("position");

  const initialRows = (templateExercises ?? []).map((te) => {
    const tePhases = (phases ?? [])
      .filter((p) => p.template_exercise_id === te.id)
      .map((p) => ({
        label: p.label ?? "",
        sets: p.sets?.toString() ?? "",
        reps: p.reps ?? "",
        rpe: p.rpe?.toString() ?? "",
        rest: p.rest ?? "",
        startWeek: p.start_week?.toString() ?? "",
        endWeek: p.end_week?.toString() ?? "",
      }));
    return {
      exerciseId: te.exercise_id,
      section: te.section ?? "",
      supersetGroup: te.superset_group ?? "",
      weight: te.weight?.toString() ?? "",
      notes: te.notes ?? "",
      phases: tePhases.length > 0 ? tePhases : [{ label: "", sets: "", reps: "", rpe: "", rest: "", startWeek: "", endWeek: "" }],
    };
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Edit template</h1>
      <EditTemplateForm
        templateId={template.id}
        cycles={cycles ?? []}
        exercises={exercises ?? []}
        initialRows={initialRows}
        initial={{
          name: template.name,
          notes: template.notes ?? "",
          cycleId: template.cycle_id ?? "",
          dayOfWeek: template.day_of_week === null ? "" : template.day_of_week.toString(),
        }}
      />
    </div>
  );
}
