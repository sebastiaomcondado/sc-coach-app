"use client";

import { useMemo, useState } from "react";
import { BadgeList } from "@/components/BadgeList";
import type { BadgeKey } from "@/lib/supabase/types";

type Athlete = { id: string; full_name: string; squad_group_id: string | null };
type Group = { id: string; name: string };
type PodiumEntry = { athleteId: string; fullName: string; count: number; place: 1 | 2 | 3 };

const PLACE_ICONS: Record<1 | 2 | 3, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function LeaderboardsView({
  athletes,
  groups,
  allTimeCompleted,
  thisMonthCompleted,
  strengthGained,
  thisMonthPodium,
  lastMonthPodium,
  badgesByAthlete,
}: {
  athletes: Athlete[];
  groups: Group[];
  allTimeCompleted: Record<string, number>;
  thisMonthCompleted: Record<string, number>;
  strengthGained: Record<string, number>;
  thisMonthPodium: PodiumEntry[];
  lastMonthPodium: PodiumEntry[];
  badgesByAthlete: Record<string, { badge_key: string; earned_at: string }[]>;
}) {
  const [groupFilter, setGroupFilter] = useState("");
  const [workoutsView, setWorkoutsView] = useState<"all-time" | "month">("all-time");

  const filteredAthletes = useMemo(
    () => (groupFilter ? athletes.filter((a) => a.squad_group_id === groupFilter) : athletes),
    [athletes, groupFilter]
  );

  function badgeKeysFor(athleteId: string): BadgeKey[] {
    return (badgesByAthlete[athleteId] ?? []).map((b) => b.badge_key as BadgeKey);
  }

  function lastMonthPlaceFor(athleteId: string): 1 | 2 | 3 | null {
    return lastMonthPodium.find((p) => p.athleteId === athleteId)?.place ?? null;
  }

  const workoutCounts = workoutsView === "all-time" ? allTimeCompleted : thisMonthCompleted;
  const workoutsRanked = [...filteredAthletes]
    .map((a) => ({ athlete: a, value: workoutCounts[a.id] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const strengthRanked = [...filteredAthletes]
    .map((a) => ({ athlete: a, value: strengthGained[a.id] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">
          This month&apos;s podium
        </h2>
        {thisMonthPodium.length === 0 ? (
          <p className="text-neutral-400">No workouts completed yet this month.</p>
        ) : (
          <ol className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {thisMonthPodium.map((p) => (
              <li key={p.athleteId} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-white">
                  <span className="mr-2">{PLACE_ICONS[p.place]}</span>
                  {p.fullName}
                </span>
                <span className="flex items-center gap-3">
                  <BadgeList badgeKeys={badgeKeysFor(p.athleteId)} lastMonthPlace={lastMonthPlaceFor(p.athleteId)} />
                  <span className="text-sm font-medium text-emerald-400">{p.count} completed</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {groups.length > 0 && (
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Filter leaderboards by group</label>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
          >
            <option value="">All athletes</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">Workouts completed</h2>
          <select
            value={workoutsView}
            onChange={(e) => setWorkoutsView(e.target.value as "all-time" | "month")}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-white"
          >
            <option value="all-time">All-time</option>
            <option value="month">This month</option>
          </select>
        </div>
        {filteredAthletes.length === 0 ? (
          <p className="text-neutral-400">No athletes in this group.</p>
        ) : (
          <ol className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {workoutsRanked.map((r, i) => (
              <li key={r.athlete.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-white">
                  <span className="mr-2 text-neutral-500">{i + 1}.</span>
                  {r.athlete.full_name}
                </span>
                <span className="flex items-center gap-3">
                  <BadgeList
                    badgeKeys={badgeKeysFor(r.athlete.id)}
                    lastMonthPlace={lastMonthPlaceFor(r.athlete.id)}
                  />
                  <span className="text-sm font-medium text-neutral-300">{r.value} completed</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">
          Strength gained (squat/deadlift/row/bench)
        </h2>
        {filteredAthletes.length === 0 ? (
          <p className="text-neutral-400">No athletes in this group.</p>
        ) : (
          <ol className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {strengthRanked.map((r, i) => (
              <li key={r.athlete.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-white">
                  <span className="mr-2 text-neutral-500">{i + 1}.</span>
                  {r.athlete.full_name}
                </span>
                <span className="flex items-center gap-3">
                  <BadgeList
                    badgeKeys={badgeKeysFor(r.athlete.id)}
                    lastMonthPlace={lastMonthPlaceFor(r.athlete.id)}
                  />
                  <span className="text-sm font-medium text-neutral-300">+{r.value} kg</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
