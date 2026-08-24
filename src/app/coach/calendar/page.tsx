import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { TrainingCalendar } from "@/components/TrainingCalendar";
import { CycleFilterSelect } from "@/components/CycleFilterSelect";

export default async function CoachCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { cycle } = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: workouts }, { data: cycles }] = await Promise.all([
    supabase
      .from("workouts")
      .select(
        "id, title, scheduled_date, athlete_id, cycle_id, athlete:profiles!workouts_athlete_id_fkey(full_name)"
      )
      .eq("coach_id", profile!.id),
    supabase.from("training_cycles").select("id, name").eq("coach_id", profile!.id).order("name"),
  ]);

  const filtered = cycle ? (workouts ?? []).filter((w) => w.cycle_id === cycle) : workouts ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Calendar</h1>
        <CycleFilterSelect cycles={cycles ?? []} />
      </div>
      <TrainingCalendar
        workouts={filtered.map((w) => {
          const athlete = Array.isArray(w.athlete) ? w.athlete[0] : w.athlete;
          return {
            id: w.id,
            title: w.title,
            scheduledDate: w.scheduled_date,
            athleteName: athlete?.full_name,
            href: `/coach/athletes/${w.athlete_id}`,
          };
        })}
      />
    </div>
  );
}
