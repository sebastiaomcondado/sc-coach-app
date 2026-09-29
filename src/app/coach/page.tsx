import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTeamOwnerId } from "@/lib/auth";
import { positionSubgroupsFor, subdivideByPosition } from "@/lib/positions";
import { computeOneRmSuggestions, computeQualifyingOneRmFlags } from "@/lib/tests";

type RosterAthlete = {
  id: string;
  full_name: string;
  position: string | null;
  jersey_number: number | null;
  groupName: string | null;
};

export default async function RosterPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("coach_athletes")
    .select(
      "athlete_id, athlete:profiles!coach_athletes_athlete_id_fkey(id, full_name, position, jersey_number, squad_group:squad_groups!profiles_squad_group_id_fkey(name))"
    )
    .eq("coach_id", getTeamOwnerId(profile!));

  const athletes = (rows ?? [])
    .map((r) => r.athlete)
    .filter((a): a is NonNullable<typeof a> => !!a)
    .map((a): RosterAthlete => {
      const squadGroup = Array.isArray(a.squad_group) ? a.squad_group[0] : a.squad_group;
      return {
        id: a.id,
        full_name: a.full_name,
        position: a.position,
        jersey_number: a.jersey_number,
        groupName: squadGroup?.name ?? null,
      };
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  const athleteIds = athletes.map((a) => a.id);
  const newPrByAthlete = new Map<string, boolean>();

  if (athleteIds.length > 0) {
    const [{ data: fixedTestTypes }, { data: loggedSets }, { data: results }, { data: dismissals }] =
      await Promise.all([
        supabase.from("test_types").select("id, name").is("coach_id", null),
        supabase
          .from("logged_sets")
          .select(
            "athlete_id, weight, reps, workout_exercise:workout_exercises(exercise:exercises(name, one_rm_category), workout:workouts(scheduled_date))"
          )
          .in("athlete_id", athleteIds),
        supabase.from("test_results").select("athlete_id, test_type_id, value").in("athlete_id", athleteIds),
        supabase
          .from("one_rm_suggestion_dismissals")
          .select("athlete_id, test_type_id, dismissed_value")
          .in("athlete_id", athleteIds),
      ]);

    const loggedSetsByAthlete = new Map<string, Parameters<typeof computeOneRmSuggestions>[0]>();
    for (const row of loggedSets ?? []) {
      const we = Array.isArray(row.workout_exercise) ? row.workout_exercise[0] : row.workout_exercise;
      const exercise = we?.exercise ? (Array.isArray(we.exercise) ? we.exercise[0] : we.exercise) : null;
      const workout = we?.workout ? (Array.isArray(we.workout) ? we.workout[0] : we.workout) : null;
      const list = loggedSetsByAthlete.get(row.athlete_id) ?? [];
      list.push({
        weight: row.weight,
        reps: row.reps,
        exerciseName: exercise?.name ?? "",
        oneRmCategory: exercise?.one_rm_category ?? null,
        sessionDate: workout?.scheduled_date ?? null,
      });
      loggedSetsByAthlete.set(row.athlete_id, list);
    }

    const bestByAthlete = new Map<string, Map<string, number>>();
    for (const r of results ?? []) {
      const byTestType = bestByAthlete.get(r.athlete_id) ?? new Map<string, number>();
      const current = byTestType.get(r.test_type_id);
      if (current == null || r.value > current) byTestType.set(r.test_type_id, r.value);
      bestByAthlete.set(r.athlete_id, byTestType);
    }

    const dismissedByAthlete = new Map<string, Map<string, number>>();
    for (const d of dismissals ?? []) {
      const byTestType = dismissedByAthlete.get(d.athlete_id) ?? new Map<string, number>();
      byTestType.set(d.test_type_id, d.dismissed_value);
      dismissedByAthlete.set(d.athlete_id, byTestType);
    }

    for (const athleteId of athleteIds) {
      const oneRmByCategory = computeOneRmSuggestions(loggedSetsByAthlete.get(athleteId) ?? []);
      const flags = computeQualifyingOneRmFlags(
        fixedTestTypes ?? [],
        oneRmByCategory,
        bestByAthlete.get(athleteId) ?? new Map(),
        dismissedByAthlete.get(athleteId) ?? new Map()
      );
      newPrByAthlete.set(athleteId, flags.length > 0);
    }
  }

  const groups = new Map<string, RosterAthlete[]>();
  for (const athlete of athletes) {
    const key = athlete.groupName ?? "Unassigned";
    groups.set(key, [...(groups.get(key) ?? []), athlete]);
  }
  const orderedGroups = [...groups.keys()].filter((k) => k !== "Unassigned").sort();
  if (groups.has("Unassigned")) orderedGroups.push("Unassigned");

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
        <div className="space-y-6">
          {orderedGroups.map((group) => {
            const positions = positionSubgroupsFor(group);
            const groupAthletes = groups.get(group)!;

            return (
              <div key={group}>
                <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-400">
                  {group}
                </h2>
                {positions ? (
                  <div className="space-y-4">
                    {subdivideByPosition(groupAthletes, positions).map((section) => (
                      <div key={section.label}>
                        <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
                          {section.label}
                        </h3>
                        <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
                          {section.athletes.map((athlete) => (
                            <RosterAthleteRow
                              key={athlete.id}
                              athlete={athlete}
                              hasNewPr={newPrByAthlete.get(athlete.id) ?? false}
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
                    {groupAthletes.map((athlete) => (
                      <RosterAthleteRow
                        key={athlete.id}
                        athlete={athlete}
                        hasNewPr={newPrByAthlete.get(athlete.id) ?? false}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RosterAthleteRow({ athlete, hasNewPr }: { athlete: RosterAthlete; hasNewPr: boolean }) {
  return (
    <li className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900">
      <Link href={`/coach/athletes/${athlete.id}`} className="min-w-0 flex-1">
        <span className="text-white">{athlete.full_name}</span>
        <span className="ml-2 text-sm text-neutral-500">
          {[athlete.position, athlete.jersey_number ? `#${athlete.jersey_number}` : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-3">
        {hasNewPr && (
          <Link
            href={`/coach/tests/${athlete.id}`}
            title="New estimated 1RM to review"
            aria-label="New estimated 1RM to review"
            className="h-2 w-2 rounded-full bg-emerald-400"
          />
        )}
        <Link href={`/coach/athletes/${athlete.id}`} className="text-sm text-neutral-500">
          View progress →
        </Link>
      </div>
    </li>
  );
}
