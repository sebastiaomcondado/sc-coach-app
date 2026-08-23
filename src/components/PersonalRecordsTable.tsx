import type { PersonalRecord } from "@/lib/progress";

export function PersonalRecordsTable({ records }: { records: PersonalRecord[] }) {
  if (records.length === 0) {
    return <p className="text-neutral-400">No personal records yet.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
      {records.map((pr) => (
        <li key={pr.exerciseName} className="flex items-center justify-between px-4 py-3">
          <span className="text-white">{pr.exerciseName}</span>
          <span className="text-sm text-neutral-400">
            <span className="font-medium text-emerald-400">{pr.weight}</span> — {pr.date}
          </span>
        </li>
      ))}
    </ul>
  );
}
