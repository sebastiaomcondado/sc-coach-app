"use client";

import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export type ExerciseSeries = {
  exerciseName: string;
  points: { date: string; weight: number }[];
};

export function ProgressChart({ series }: { series: ExerciseSeries[] }) {
  const [selected, setSelected] = useState(series[0]?.exerciseName ?? "");
  const current = useMemo(() => series.find((s) => s.exerciseName === selected), [series, selected]);

  if (series.length === 0) {
    return <p className="text-neutral-400">No logged sets yet — nothing to chart.</p>;
  }

  return (
    <div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mb-4 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
      >
        {series.map((s) => (
          <option key={s.exerciseName} value={s.exerciseName}>
            {s.exerciseName}
          </option>
        ))}
      </select>

      <div className="h-64 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={current?.points ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="date" stroke="#737373" fontSize={12} />
            <YAxis stroke="#737373" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "#171717", border: "1px solid #404040", fontSize: 12 }}
              labelStyle={{ color: "#fafafa" }}
            />
            <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-neutral-500">Top weight logged per session.</p>
    </div>
  );
}
