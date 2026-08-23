import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAvatarUrl } from "@/lib/avatar";
import { buildProgressSeries, buildPersonalRecords } from "@/lib/progress";
import { ProgressChart } from "@/components/ProgressChart";
import { PersonalRecordsTable } from "@/components/PersonalRecordsTable";
import { MetricsChart } from "@/components/MetricsChart";

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default async function AthleteDetailPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", athleteId)
    .single();

  if (!athlete) notFound();

  const [{ data: workouts }, { data: loggedSets }, { data: metrics }, photoUrl] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, title, scheduled_date")
      .eq("athlete_id", athleteId)
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("logged_sets")
      .select(
        "weight, workout_exercise:workout_exercises(exercise:exercises(name), workout:workouts(scheduled_date))"
      )
      .eq("athlete_id", athleteId),
    supabase.from("body_metrics").select("*").eq("athlete_id", athleteId).order("logged_date"),
    getAvatarUrl(supabase, athlete.photo_path),
  ]);

  const series = buildProgressSeries(
    (loggedSets ?? []).map((row) => ({
      weight: row.weight,
      workout_exercise: Array.isArray(row.workout_exercise)
        ? row.workout_exercise[0] ?? null
        : row.workout_exercise,
    }))
  );

  const metricRows = metrics ?? [];
  const metricSeries = [
    {
      label: "Bodyweight (kg)",
      points: metricRows
        .filter((r) => r.bodyweight_kg != null)
        .map((r) => ({ date: r.logged_date, value: r.bodyweight_kg! })),
    },
    {
      label: "Sleep (hrs)",
      points: metricRows
        .filter((r) => r.sleep_hours != null)
        .map((r) => ({ date: r.logged_date, value: r.sleep_hours! })),
    },
    {
      label: "Readiness (1–10)",
      points: metricRows
        .filter((r) => r.readiness != null)
        .map((r) => ({ date: r.logged_date, value: r.readiness! })),
    },
  ];

  const age = calculateAge(athlete.date_of_birth);

  return (
    <div>
      <Link href="/coach" className="mb-4 inline-block text-sm text-neutral-400 hover:text-white">
        ← Roster
      </Link>

      <div className="mb-8 flex items-start gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-20 w-20 rounded-full object-cover border border-neutral-700" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-neutral-800 border border-neutral-700" />
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">{athlete.full_name}</h1>
            <Link
              href={`/coach/athletes/${athleteId}/edit`}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              Edit profile
            </Link>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            {[
              athlete.position,
              athlete.jersey_number ? `#${athlete.jersey_number}` : null,
              athlete.squad,
              age != null ? `${age} yrs` : null,
              athlete.height_cm ? `${athlete.height_cm} cm` : null,
              athlete.weight_kg ? `${athlete.weight_kg} kg` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "No profile details yet."}
          </p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">
          Personal records
        </h2>
        <PersonalRecordsTable records={buildPersonalRecords(series)} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">Progress</h2>
        <ProgressChart series={series} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">
          Body metrics
        </h2>
        <MetricsChart series={metricSeries} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-400">Workouts</h2>
        {!workouts || workouts.length === 0 ? (
          <p className="text-neutral-400">No workouts assigned yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {workouts.map((w) => (
              <li key={w.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-white">{w.title}</span>
                <span className="text-sm text-neutral-500">{w.scheduled_date}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
