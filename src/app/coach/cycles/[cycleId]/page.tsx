import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { AssignCycleToGroup } from "@/components/AssignCycleToGroup";

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("training_cycles")
    .select("id, name, start_date, end_date, notes")
    .eq("id", cycleId)
    .single();

  if (!cycle) notFound();

  const { data: templates } = await supabase
    .from("program_templates")
    .select("id, name, notes")
    .eq("cycle_id", cycleId)
    .order("name");

  const { data: rosterRows } = await supabase
    .from("coach_athletes")
    .select("athlete:profiles!coach_athletes_athlete_id_fkey(squad)")
    .eq("coach_id", profile!.id);

  const groups = [
    ...new Set((rosterRows ?? []).map((r) => r.athlete?.squad).filter((s): s is string => !!s)),
  ].sort();

  return (
    <div>
      <Link href="/coach/cycles" className="mb-4 inline-block text-sm text-neutral-400 hover:text-white">
        ← Cycles
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{cycle.name}</h1>
          {(cycle.start_date || cycle.end_date) && (
            <p className="mt-1 text-sm text-neutral-400">
              {cycle.start_date ?? "…"} – {cycle.end_date ?? "…"}
            </p>
          )}
          {cycle.notes && <p className="mt-1 text-sm text-neutral-400">{cycle.notes}</p>}
        </div>
        <Link
          href={`/coach/cycles/${cycle.id}/edit`}
          className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
        >
          Edit cycle
        </Link>
      </div>

      <div className="mb-6">
        <AssignCycleToGroup cycleId={cycle.id} groups={groups} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">Templates</h2>
        <Link
          href={`/coach/templates/new?cycle=${cycle.id}`}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          + New template in this cycle
        </Link>
      </div>

      {!templates || templates.length === 0 ? (
        <p className="text-neutral-400">No templates in this cycle yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <Link href={`/coach/templates/${t.id}`} className="min-w-0 flex-1 hover:underline">
                <span className="text-white">{t.name}</span>
                {t.notes && <p className="mt-1 text-sm text-neutral-500">{t.notes}</p>}
              </Link>
              <Link
                href={`/coach/workouts/new?template=${t.id}`}
                className="shrink-0 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                Assign
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
