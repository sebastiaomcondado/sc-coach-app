import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { ImportTemplateForm } from "@/components/ImportTemplateForm";

export default async function ImportTemplatePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: cycles } = await supabase
    .from("training_cycles")
    .select("id, name")
    .eq("coach_id", profile!.id)
    .order("name");

  return <ImportTemplateForm cycles={cycles ?? []} />;
}
