"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type CalendarWorkout = {
  id: string;
  title: string;
  scheduledDate: string;
  athleteName?: string;
  href: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function TrainingCalendar({ workouts }: { workouts: CalendarWorkout[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateKey(today.getFullYear(), today.getMonth(), today.getDate()));

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarWorkout[]>();
    for (const w of workouts) {
      const list = map.get(w.scheduledDate) ?? [];
      list.push(w);
      map.set(w.scheduledDate, list);
    }
    return map;
  }, [workouts]);

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function goToMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  const selectedWorkouts = byDate.get(selectedDate) ?? [];
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          className="rounded-md border border-neutral-700 px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-800"
        >
          ←
        </button>
        <h2 className="text-sm font-medium text-white">
          {firstOfMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          className="rounded-md border border-neutral-700 px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-800"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day == null) return <div key={i} />;
          const key = toDateKey(year, month, day);
          const dayWorkouts = byDate.get(key) ?? [];
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;

          return (
            <button
              type="button"
              key={i}
              onClick={() => setSelectedDate(key)}
              className={`flex h-16 flex-col items-center justify-start rounded-md border p-1 text-sm ${
                isSelected
                  ? "border-emerald-500 bg-emerald-600/10"
                  : "border-neutral-800 hover:bg-neutral-900"
              }`}
            >
              <span className={isToday ? "font-semibold text-emerald-400" : "text-neutral-300"}>{day}</span>
              {dayWorkouts.length > 0 && (
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-medium text-neutral-400">{selectedDate}</h3>
        {selectedWorkouts.length === 0 ? (
          <p className="text-sm text-neutral-500">No workouts this day.</p>
        ) : (
          <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {selectedWorkouts.map((w) => (
              <li key={w.id}>
                <Link href={w.href} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900">
                  <span className="text-white">{w.title}</span>
                  {w.athleteName && <span className="text-sm text-neutral-500">{w.athleteName}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
