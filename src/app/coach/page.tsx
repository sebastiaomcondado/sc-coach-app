import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export default async function RosterPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("coach_athletes")
    .select(
      "athlete_id, athlete:profiles!coach_athletes_athlete_id_fkey(id, full_name, position, jersey_number, squad)"
    )
    .eq("coach_id", profile!.id);

  type RosterAthlete = {
    id: string;
    full_name: string;
    position: string | null;
    jersey_number: number | null;
    squad: string | null;
  };

  const athletes = (rows ?? [])
    .map((r) => r.athlete)
    .filter((a): a is RosterAthlete => !!a)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Your roster</h1>
        <Link
          href="/coach/athletes/new"
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          + Add athlete
        </Link>
      </div>

      {athletes.length === 0 ? (
        <p className="text-neutral-400">
          No athletes yet.{" "}
          <Link href="/coach/athletes/new" className="text-emerald-400 hover:underline">
            Add your first athlete
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {athletes.map((athlete) => (
            <li key={athlete.id}>
              <Link
                href={`/coach/athletes/${athlete.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900"
              >
                <div>
                  <span className="text-white">{athlete.full_name}</span>
                  <span className="ml-2 text-sm text-neutral-500">
                    {[
                      athlete.position,
                      athlete.jersey_number ? `#${athlete.jersey_number}` : null,
                      athlete.squad,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <span className="text-sm text-neutral-500">View progress →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
