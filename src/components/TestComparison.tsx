"use client";

import { useMemo, useState } from "react";
import { bestResult } from "@/lib/tests";

type TestType = { id: string; name: string; unit: string; higher_is_better: boolean };
type TestResult = { id: string; test_type_id: string; athlete_id: string; value: number; logged_date: string };
type Athlete = { id: string; full_name: string };

export function TestComparison({
  testTypes,
  results,
  athletes,
}: {
  testTypes: TestType[];
  results: TestResult[];
  athletes: Athlete[];
}) {
  const [selectedTestId, setSelectedTestId] = useState(testTypes[0]?.id ?? "");
  const selectedTest = testTypes.find((t) => t.id === selectedTestId);

  const bestByAthleteAndTest = useMemo(() => {
    const map = new Map<string, Map<string, { value: number }>>();
    for (const athlete of athletes) {
      const perTest = new Map<string, { value: number }>();
      for (const test of testTypes) {
        const athleteResults = results.filter((r) => r.athlete_id === athlete.id && r.test_type_id === test.id);
        const best = bestResult(athleteResults, test.higher_is_better);
        if (best) perTest.set(test.id, { value: best.value });
      }
      map.set(athlete.id, perTest);
    }
    return map;
  }, [athletes, testTypes, results]);

  const ranked = useMemo(() => {
    if (!selectedTest) return [];
    return athletes
      .map((a) => ({ athlete: a, best: bestByAthleteAndTest.get(a.id)?.get(selectedTest.id) ?? null }))
      .filter((row): row is { athlete: Athlete; best: { value: number } } => row.best !== null)
      .sort((a, b) => (selectedTest.higher_is_better ? b.best.value - a.best.value : a.best.value - b.best.value));
  }, [athletes, selectedTest, bestByAthleteAndTest]);

  if (testTypes.length === 0 || athletes.length === 0) {
    return <p className="text-neutral-400">Add athletes and log some test results to compare.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <select
          value={selectedTestId}
          onChange={(e) => setSelectedTestId(e.target.value)}
          className="mb-3 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
        >
          {testTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {ranked.length === 0 ? (
          <p className="text-neutral-400">No results logged for this test yet.</p>
        ) : (
          <ol className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {ranked.map((row, i) => (
              <li key={row.athlete.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-white">
                  <span className="mr-2 text-neutral-500">{i + 1}.</span>
                  {row.athlete.full_name}
                </span>
                <span className="text-sm font-medium text-emerald-400">
                  {row.best.value} {selectedTest?.unit}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-neutral-400">
              <th className="px-4 py-2 font-medium">Athlete</th>
              {testTypes.map((t) => (
                <th key={t.id} className="whitespace-nowrap px-4 py-2 font-medium">
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {athletes.map((a) => (
              <tr key={a.id}>
                <td className="whitespace-nowrap px-4 py-2 text-white">{a.full_name}</td>
                {testTypes.map((t) => {
                  const best = bestByAthleteAndTest.get(a.id)?.get(t.id);
                  return (
                    <td key={t.id} className="whitespace-nowrap px-4 py-2 text-neutral-300">
                      {best ? `${best.value} ${t.unit}` : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
