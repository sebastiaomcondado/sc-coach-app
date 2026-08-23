import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { BodyMetricsForm } from "@/components/BodyMetricsForm";
import { MetricsChart } from "@/components/MetricsChart";

export default async function AthleteMetricsPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: metrics } = await supabase
    .from("body_metrics")
    .select("*")
    .eq("athlete_id", profile!.id)
    .order("logged_date");

  const rows = metrics ?? [];

  const series = [
    {
      label: "Bodyweight (kg)",
      points: rows
        .filter((r) => r.bodyweight_kg != null)
        .map((r) => ({ date: r.logged_date, value: r.bodyweight_kg! })),
    },
    {
      label: "Sleep (hrs)",
      points: rows
        .filter((r) => r.sleep_hours != null)
        .map((r) => ({ date: r.logged_date, value: r.sleep_hours! })),
    },
    {
      label: "Readiness (1–10)",
      points: rows
        .filter((r) => r.readiness != null)
        .map((r) => ({ date: r.logged_date, value: r.readiness! })),
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Body metrics</h1>
      <BodyMetricsForm athleteId={profile!.id} />
      <MetricsChart series={series} />
    </div>
  );
}
