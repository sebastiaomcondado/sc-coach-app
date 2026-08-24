import { createClient } from "@/lib/supabase/server";
import { TemplateBuilder } from "@/components/TemplateBuilder";

export default async function NewTemplatePage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, category, video_url")
    .order("name");

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">New template</h1>
      <TemplateBuilder exercises={exercises ?? []} />
    </div>
  );
}
