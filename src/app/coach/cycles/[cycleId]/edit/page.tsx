import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditCycleForm } from "@/components/EditCycleForm";

export default async function EditCyclePage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("training_cycles")
    .select("id, name, start_date, end_date, notes")
    .eq("id", cycleId)
    .single();

  if (!cycle) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Edit cycle</h1>
      <EditCycleForm
        cycleId={cycle.id}
        initial={{
          name: cycle.name,
          startDate: cycle.start_date ?? "",
          endDate: cycle.end_date ?? "",
          notes: cycle.notes ?? "",
        }}
      />
    </div>
  );
}
