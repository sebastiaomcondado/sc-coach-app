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

  const [{ data: template }, { data: cycles }] = await Promise.all([
    supabase
      .from("program_templates")
      .select("id, name, notes, cycle_id, day_of_week")
      .eq("id", templateId)
      .single(),
    supabase.from("training_cycles").select("id, name").eq("coach_id", profile!.id).order("name"),
  ]);

  if (!template) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Edit template</h1>
      <EditTemplateForm
        templateId={template.id}
        cycles={cycles ?? []}
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
