import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import {
  countCompletedWorkoutsByAthlete,
  computeStrengthGained,
  computePodium,
  currentMonthKey,
  previousMonthKey,
  type WorkoutCompletionRow,
  type LoggedSetForStrength,
  type PodiumEntry,
} from "@/lib/leaderboards";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type RosterAthlete = { id: string; full_name: string; squad_group_id: string | null };

export type LeaderboardsData = {
  athletes: RosterAthlete[];
  groups: { id: string; name: string }[];
  allTimeCompleted: Record<string, number>;
  thisMonthCompleted: Record<string, number>;
  strengthGained: Record<string, number>;
  thisMonthPodium: PodiumEntry[];
  lastMonthPodium: PodiumEntry[];
  badgesByAthlete: Record<string, { badge_key: string; earned_at: string }[]>;
};

// An athlete can't see teammates' data via normal RLS (by design), but the
// leaderboards/podium/badges are meant to be visible to the whole roster. So
// this loader uses the admin client to compute the roster-wide aggregate —
// but only ever for the coachId the caller has already legitimately
// resolved via resolveCoachId below, never an arbitrary one.
export async function resolveCoachId(
  supabase: SupabaseClient<Database>,
  profile: Profile
): Promise<string | null> {
  if (profile.role === "coach") return profile.id;

  const { data } = await supabase
    .from("coach_athletes")
    .select("coach_id")
    .eq("athlete_id", profile.id)
    .limit(1)
    .maybeSingle();

  return data?.coach_id ?? null;
}

export async function loadLeaderboardsData(coachId: string): Promise<LeaderboardsData> {
  const admin = createAdminClient();

  const [{ data: rosterRows }, { data: groups }] = await Promise.all([
    admin
      .from("coach_athletes")
      .select("athlete:profiles!coach_athletes_athlete_id_fkey(id, full_name, squad_group_id)")
      .eq("coach_id", coachId),
    admin.from("squad_groups").select("id, name").eq("coach_id", coachId).order("name"),
  ]);

  const athletes = (rosterRows ?? [])
    .map((r) => (Array.isArray(r.athlete) ? r.athlete[0] : r.athlete))
    .filter((a): a is RosterAthlete => !!a)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  const empty: LeaderboardsData = {
    athletes: [],
    groups: groups ?? [],
    allTimeCompleted: {},
    thisMonthCompleted: {},
    strengthGained: {},
    thisMonthPodium: [],
    lastMonthPodium: [],
    badgesByAthlete: {},
  };
  if (athletes.length === 0) return empty;

  const athleteIds = athletes.map((a) => a.id);

  const [{ data: workoutRows }, { data: loggedSetRows }, { data: badgeRows }] = await Promise.all([
    admin
      .from("workouts")
      .select("athlete_id, scheduled_date, workout_exercises(id, logged_sets(id))")
      .in("athlete_id", athleteIds),
    admin
      .from("logged_sets")
      .select(
        "weight, athlete_id, workout_exercise:workout_exercises(exercise:exercises(one_rm_category), workout:workouts(scheduled_date))"
      )
      .in("athlete_id", athleteIds),
    admin.from("athlete_badges").select("athlete_id, badge_key, earned_at").in("athlete_id", athleteIds),
  ]);

  const completionRows: WorkoutCompletionRow[] = (workoutRows ?? []).map((w) => ({
    athlete_id: w.athlete_id,
    scheduled_date: w.scheduled_date,
    exerciseCompletion: (w.workout_exercises ?? []).map((we) => (we.logged_sets ?? []).length > 0),
  }));

  const allTimeCompleted = countCompletedWorkoutsByAthlete(completionRows);
  const thisMonthCompleted = countCompletedWorkoutsByAthlete(completionRows, currentMonthKey());
  const lastMonthCompleted = countCompletedWorkoutsByAthlete(completionRows, previousMonthKey());

  const strengthRows: LoggedSetForStrength[] = (loggedSetRows ?? [])
    .map((r) => {
      const we = Array.isArray(r.workout_exercise) ? r.workout_exercise[0] : r.workout_exercise;
      const exercise = we?.exercise ? (Array.isArray(we.exercise) ? we.exercise[0] : we.exercise) : null;
      const workout = we?.workout ? (Array.isArray(we.workout) ? we.workout[0] : we.workout) : null;
      return {
        athlete_id: r.athlete_id,
        weight: r.weight,
        oneRmCategory: exercise?.one_rm_category ?? null,
        date: workout?.scheduled_date ?? "",
      };
    })
    .filter((r) => r.date !== "");

  const strengthGained = computeStrengthGained(strengthRows);

  const badgesByAthlete: Record<string, { badge_key: string; earned_at: string }[]> = {};
  for (const b of badgeRows ?? []) {
    if (!badgesByAthlete[b.athlete_id]) badgesByAthlete[b.athlete_id] = [];
    badgesByAthlete[b.athlete_id].push({ badge_key: b.badge_key, earned_at: b.earned_at });
  }

  return {
    athletes,
    groups: groups ?? [],
    allTimeCompleted: Object.fromEntries(allTimeCompleted),
    thisMonthCompleted: Object.fromEntries(thisMonthCompleted),
    strengthGained: Object.fromEntries(strengthGained),
    thisMonthPodium: computePodium(thisMonthCompleted, athletes),
    lastMonthPodium: computePodium(lastMonthCompleted, athletes),
    badgesByAthlete,
  };
}
