"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ONE_RM_CATEGORIES, ONE_RM_CATEGORY_LABELS } from "@/lib/tests";
import type { OneRmCategory } from "@/lib/supabase/types";

export function ExerciseOneRmTag({
  exerciseId,
  initialCategory,
}: {
  exerciseId: string;
  initialCategory: OneRmCategory | null;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<OneRmCategory | "">(initialCategory ?? "");

  async function handleChange(value: string) {
    const next = (value || null) as OneRmCategory | null;
    setCategory(next ?? "");

    const supabase = createClient();
    await supabase.from("exercises").update({ one_rm_category: next }).eq("id", exerciseId);
    router.refresh();
  }

  return (
    <select
      value={category}
      onChange={(e) => handleChange(e.target.value)}
      className="shrink-0 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-300"
    >
      <option value="">Counts toward 1RM: none</option>
      {ONE_RM_CATEGORIES.map((c) => (
        <option key={c} value={c}>
          Counts toward: {ONE_RM_CATEGORY_LABELS[c]} 1RM
        </option>
      ))}
    </select>
  );
}
