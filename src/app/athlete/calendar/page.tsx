import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { TrainingCalendar } from "@/components/TrainingCalendar";

export default async function AthleteCalendarPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, title, scheduled_date")
    .eq("athlete_id", profile!.id);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Calendar</h1>
      <TrainingCalendar
        workouts={(workouts ?? []).map((w) => ({
          id: w.id,
          title: w.title,
          scheduledDate: w.scheduled_date,
          href: `/athlete/workouts/${w.id}`,
        }))}
      />
    </div>
  );
}
