import type { OneRmCategory } from "@/lib/supabase/types";

export type WorkoutCompletionRow = {
  athlete_id: string;
  scheduled_date: string;
  exerciseCompletion: boolean[]; // one entry per prescribed exercise; true if it has >=1 logged set
};

// A workout is complete when every prescribed exercise has at least one
// logged set. A workout with zero exercises is never complete.
export function isWorkoutCompleted(w: WorkoutCompletionRow): boolean {
  return w.exerciseCompletion.length > 0 && w.exerciseCompletion.every(Boolean);
}

export function countCompletedWorkoutsByAthlete(
  workouts: WorkoutCompletionRow[],
  monthKey?: string
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const w of workouts) {
    if (monthKey && w.scheduled_date.slice(0, 7) !== monthKey) continue;
    if (!isWorkoutCompleted(w)) continue;
    counts.set(w.athlete_id, (counts.get(w.athlete_id) ?? 0) + 1);
  }
  return counts;
}

export function currentMonthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export function previousMonthKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}

export type PodiumEntry = { athleteId: string; fullName: string; count: number; place: 1 | 2 | 3 };

// Top 3 by count, excluding anyone with a count of 0 (they haven't
// completed anything for this period, so they're not podium-eligible).
export function computePodium(
  counts: Map<string, number>,
  athletes: { id: string; full_name: string }[]
): PodiumEntry[] {
  return athletes
    .map((a) => ({ athleteId: a.id, fullName: a.full_name, count: counts.get(a.id) ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((r, i) => ({ ...r, place: (i + 1) as 1 | 2 | 3 }));
}

export type LoggedSetForStrength = {
  athlete_id: string;
  weight: number | null;
  oneRmCategory: OneRmCategory | null;
  date: string;
};

// Per athlete, sums (heaviest ever logged - earliest ever logged) across the
// four tagged 1RM categories. "Earliest" means chronologically first, not
// lightest, so this reflects genuine progress from wherever they started.
export function computeStrengthGained(rows: LoggedSetForStrength[]): Map<string, number> {
  const byAthleteCategory = new Map<string, Map<OneRmCategory, LoggedSetForStrength[]>>();
  for (const r of rows) {
    if (!r.oneRmCategory || r.weight == null) continue;
    if (!byAthleteCategory.has(r.athlete_id)) byAthleteCategory.set(r.athlete_id, new Map());
    const byCat = byAthleteCategory.get(r.athlete_id)!;
    if (!byCat.has(r.oneRmCategory)) byCat.set(r.oneRmCategory, []);
    byCat.get(r.oneRmCategory)!.push(r);
  }

  const totals = new Map<string, number>();
  for (const [athleteId, byCat] of byAthleteCategory) {
    let total = 0;
    for (const sets of byCat.values()) {
      const sorted = [...sets].sort((a, b) => a.date.localeCompare(b.date));
      const earliest = sorted[0].weight!;
      const heaviest = Math.max(...sets.map((s) => s.weight!));
      total += heaviest - earliest;
    }
    totals.set(athleteId, Math.round(total * 10) / 10);
  }
  return totals;
}
