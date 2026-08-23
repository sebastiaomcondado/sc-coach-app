import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { TrainingCalendar } from "@/components/TrainingCalendar";

export default async function CoachCalendarPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, title, scheduled_date, athlete_id, athlete:profiles!workouts_athlete_id_fkey(full_name)")
    .eq("coach_id", profile!.id);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Calendar</h1>
      <TrainingCalendar
        workouts={(workouts ?? []).map((w) => {
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
