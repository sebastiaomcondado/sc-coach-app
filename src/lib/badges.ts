import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, BadgeKey } from "@/lib/supabase/types";
import { isWorkoutCompleted, type WorkoutCompletionRow } from "@/lib/leaderboards";

export const WORKOUT_BADGE_THRESHOLDS = [25, 50, 100, 200] as const;
export const WEIGHT_BADGE_KG = 100;

export const BADGE_LABELS: Record<BadgeKey, string> = {
  workouts_25: "25 Workouts",
  workouts_50: "50 Workouts",
  workouts_100: "100 Workouts",
  workouts_200: "200 Workouts",
  weight_100kg: "100kg Club",
};

// Checks whether logging these weights just crossed any badge threshold for
// this athlete, and permanently awards any newly-crossed ones. Called right
// after an athlete logs a set — not on a schedule, not lazily on page load.
export async function checkAndAwardBadges(
  supabase: SupabaseClient<Database>,
  athleteId: string,
  justLoggedWeights: number[]
): Promise<BadgeKey[]> {
  const { data: existing } = await supabase
    .from("athlete_badges")
    .select("badge_key")
    .eq("athlete_id", athleteId);
  const already = new Set((existing ?? []).map((b) => b.badge_key));

  const toAward: BadgeKey[] = [];

  if (!already.has("weight_100kg") && justLoggedWeights.some((w) => w >= WEIGHT_BADGE_KG)) {
    toAward.push("weight_100kg");
  }

  const missingThresholds = WORKOUT_BADGE_THRESHOLDS.filter((t) => !already.has(`workouts_${t}` as BadgeKey));
  if (missingThresholds.length > 0) {
    const { data: workouts } = await supabase
      .from("workouts")
      .select("scheduled_date, workout_exercises(id, logged_sets(id))")
      .eq("athlete_id", athleteId);

    const completionRows: WorkoutCompletionRow[] = (workouts ?? []).map((w) => ({
      athlete_id: athleteId,
      scheduled_date: w.scheduled_date,
      exerciseCompletion: (w.workout_exercises ?? []).map((we) => (we.logged_sets ?? []).length > 0),
    }));
    const completedCount = completionRows.filter(isWorkoutCompleted).length;

    for (const t of missingThresholds) {
      if (completedCount >= t) toAward.push(`workouts_${t}` as BadgeKey);
    }
  }

  if (toAward.length > 0) {
    await supabase.from("athlete_badges").insert(toAward.map((badge_key) => ({ athlete_id: athleteId, badge_key })));
  }

  return toAward;
}
