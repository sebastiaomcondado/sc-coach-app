import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { AthleteTestPanel } from "@/components/AthleteTestPanel";

export default async function AthleteTestsPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: testTypes }, { data: results }] = await Promise.all([
    supabase.from("test_types").select("id, name, unit, higher_is_better").order("name"),
    supabase
      .from("test_results")
      .select("id, test_type_id, value, logged_date")
      .eq("athlete_id", profile!.id),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">My tests</h1>
      <AthleteTestPanel
        athleteId={profile!.id}
        testTypes={testTypes ?? []}
        initialResults={results ?? []}
        readOnly
      />
    </div>
  );
}
