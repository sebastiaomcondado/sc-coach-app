import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export default async function CyclesPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: cycles }, { data: templates }] = await Promise.all([
    supabase
      .from("training_cycles")
      .select("id, name, start_date, end_date")
      .eq("coach_id", profile!.id)
      .order("created_at", { ascending: false }),
    supabase.from("program_templates").select("id, cycle_id").eq("coach_id", profile!.id),
  ]);

  const templateCountByCycle = new Map<string, number>();
  for (const t of templates ?? []) {
    if (!t.cycle_id) continue;
    templateCountByCycle.set(t.cycle_id, (templateCountByCycle.get(t.cycle_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Training cycles</h1>
        <Link
          href="/coach/cycles/new"
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          + New cycle
        </Link>
      </div>

      {!cycles || cycles.length === 0 ? (
        <p className="text-neutral-400">
          No cycles yet.{" "}
          <Link href="/coach/cycles/new" className="text-emerald-400 hover:underline">
            Create your first one
          </Link>
          . A cycle groups the templates for one training block (e.g. a 6-week phase), so you can start
          fresh next block without losing the old one.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {cycles.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-white">{c.name}</span>
                {(c.start_date || c.end_date) && (
                  <span className="ml-2 text-sm text-neutral-500">
                    {c.start_date ?? "…"} – {c.end_date ?? "…"}
                  </span>
                )}
              </div>
              <span className="text-sm text-neutral-500">
                {templateCountByCycle.get(c.id) ?? 0} template
                {(templateCountByCycle.get(c.id) ?? 0) === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
