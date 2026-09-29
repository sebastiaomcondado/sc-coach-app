import type { OneRmCategory } from "@/lib/supabase/types";

export const ONE_RM_CATEGORIES: OneRmCategory[] = ["squat", "deadlift", "row", "bench_press"];

export const ONE_RM_CATEGORY_LABELS: Record<OneRmCategory, string> = {
  squat: "Squat",
  deadlift: "Deadlift",
  row: "Row",
  bench_press: "Bench Press",
};

// Fixed test-type name -> the 1RM category whose logged sets should be
// suggested when logging that test.
export const ONE_RM_TEST_NAME_TO_CATEGORY: Record<string, OneRmCategory> = {
  "Back Squat 1RM": "squat",
  "Deadlift 1RM": "deadlift",
  "Row 1RM": "row",
  "Bench Press 1RM": "bench_press",
};

export function estimateOneRm(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export type LoggedSetForOneRm = {
  weight: number | null;
  reps: number | null;
  exerciseName: string;
  oneRmCategory: OneRmCategory | null;
  sessionDate: string | null;
};

export type OneRmSuggestion = { value: number; source: string };

// The best (highest) estimated 1RM per category, computed from an athlete's
// logged sets for exercises tagged with that category.
export function computeOneRmSuggestions(
  loggedSets: LoggedSetForOneRm[]
): Record<OneRmCategory, OneRmSuggestion | null> {
  const best: Record<OneRmCategory, OneRmSuggestion | null> = {
    squat: null,
    deadlift: null,
    row: null,
    bench_press: null,
  };

  for (const s of loggedSets) {
    if (!s.oneRmCategory || s.weight == null || s.reps == null || !s.sessionDate) continue;
    const value = estimateOneRm(s.weight, s.reps);
    const current = best[s.oneRmCategory];
    if (!current || value > current.value) {
      best[s.oneRmCategory] = {
        value,
        source: `${s.exerciseName}, ${s.reps}×${s.weight}kg on ${s.sessionDate}`,
      };
    }
  }

  return best;
}

export type TestResultRow = { id: string; value: number; logged_date: string };

// The best logged result for a test, given whether higher or lower values win.
export function bestResult(
  results: TestResultRow[],
  higherIsBetter: boolean
): TestResultRow | null {
  if (results.length === 0) return null;
  return results.reduce((best, r) =>
    higherIsBetter ? (r.value > best.value ? r : best) : r.value < best.value ? r : best
  );
}

export type OneRmFlag = { testTypeId: string; suggestion: OneRmSuggestion };

// Which of an athlete's fixed 1RM tests currently have a qualifying new-PR
// suggestion: the estimate beats their current best logged result (or they
// have no result yet), and it isn't at or below a value the coach already
// dismissed for that test.
export function computeQualifyingOneRmFlags(
  testTypes: { id: string; name: string }[],
  oneRmByCategory: Record<OneRmCategory, OneRmSuggestion | null>,
  bestValueByTestType: Map<string, number>,
  dismissedValueByTestType: Map<string, number>
): OneRmFlag[] {
  const flags: OneRmFlag[] = [];

  for (const t of testTypes) {
    const category = ONE_RM_TEST_NAME_TO_CATEGORY[t.name];
    if (!category) continue;

    const suggestion = oneRmByCategory[category];
    if (!suggestion) continue;

    const best = bestValueByTestType.get(t.id);
    if (best != null && suggestion.value <= best) continue;

    const dismissed = dismissedValueByTestType.get(t.id);
    if (dismissed != null && suggestion.value <= dismissed) continue;

    flags.push({ testTypeId: t.id, suggestion });
  }

  return flags;
}
