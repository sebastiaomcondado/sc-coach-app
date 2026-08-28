import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { TestTypeManagement } from "@/components/TestTypeManagement";
import { TestComparison } from "@/components/TestComparison";

export default async function CoachTestsPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: testTypes }, { data: rosterRows }, { data: results }] = await Promise.all([
    supabase
      .from("test_types")
      .select("id, name, unit, higher_is_better, coach_id")
      .or(`coach_id.is.null,coach_id.eq.${profile!.id}`)
      .order("name"),
    supabase
      .from("coach_athletes")
      .select("athlete:profiles!coach_athletes_athlete_id_fkey(id, full_name)")
      .eq("coach_id", profile!.id),
    supabase.from("test_results").select("id, test_type_id, athlete_id, value, logged_date"),
  ]);

  const athletes = (rosterRows ?? [])
    .map((r) => (Array.isArray(r.athlete) ? r.athlete[0] : r.athlete))
    .filter((a): a is { id: string; full_name: string } => !!a)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Tests</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">Custom tests</h2>
        <TestTypeManagement coachId={profile!.id} initialTestTypes={testTypes ?? []} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">Compare athletes</h2>
        <TestComparison testTypes={testTypes ?? []} results={results ?? []} athletes={athletes} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">
          Log or view an athlete&apos;s tests
        </h2>
        {athletes.length === 0 ? (
          <p className="text-neutral-400">No athletes on your roster yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {athletes.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/coach/tests/${a.id}`}
                  className="block px-4 py-3 text-white hover:bg-neutral-900"
                >
                  {a.full_name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
