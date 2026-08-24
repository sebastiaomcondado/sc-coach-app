"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Cycle = { id: string; name: string };

export function CycleFilterSelect({ cycles }: { cycles: Cycle[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("cycle") ?? "";

  if (cycles.length === 0) return null;

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("cycle", value);
    else params.delete("cycle");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white"
    >
      <option value="">All cycles</option>
      {cycles.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
