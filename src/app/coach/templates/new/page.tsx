import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { TemplateBuilder } from "@/components/TemplateBuilder";

export default async function NewTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { cycle } = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: exercises }, { data: cycles }] = await Promise.all([
    supabase.from("exercises").select("id, name, category, video_url").order("name"),
    supabase.from("training_cycles").select("id, name").eq("coach_id", profile!.id).order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">New template</h1>
      <TemplateBuilder exercises={exercises ?? []} cycles={cycles ?? []} initialCycleId={cycle} />
    </div>
  );
}
