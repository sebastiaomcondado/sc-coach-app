"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function GroupChangeBanner({
  athleteId,
  groupName,
  currentGroupId,
}: {
  athleteId: string;
  groupName: string;
  currentGroupId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDismiss() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ group_notice_seen_group_id: currentGroupId })
      .eq("id", athleteId);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center gap-3 border-b border-emerald-900/50 bg-emerald-950/50 px-4 py-2 text-center text-sm text-emerald-200">
      <span>Your coach moved you to {groupName}.</span>
      <button
        type="button"
        onClick={handleDismiss}
        disabled={loading}
        className="rounded-md border border-emerald-700 px-2 py-0.5 text-xs text-emerald-100 hover:bg-emerald-900 disabled:opacity-50"
      >
        Got it
      </button>
    </div>
  );
}
