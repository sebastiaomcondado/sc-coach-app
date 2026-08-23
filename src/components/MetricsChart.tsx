"use client";

import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export type MetricSeries = {
  label: string;
  points: { date: string; value: number }[];
};

export function MetricsChart({ series }: { series: MetricSeries[] }) {
  const [selected, setSelected] = useState(series[0]?.label ?? "");
  const current = useMemo(() => series.find((s) => s.label === selected), [series, selected]);

  if (series.every((s) => s.points.length === 0)) {
    return <p className="text-neutral-400">No body metrics logged yet.</p>;
  }

  return (
    <div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mb-4 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
      >
        {series.map((s) => (
          <option key={s.label} value={s.label}>
            {s.label}
          </option>
        ))}
      </select>

      <div className="h-56 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={current?.points ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="date" stroke="#737373" fontSize={12} />
            <YAxis stroke="#737373" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "#171717", border: "1px solid #404040", fontSize: 12 }}
              labelStyle={{ color: "#fafafa" }}
            />
            <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
