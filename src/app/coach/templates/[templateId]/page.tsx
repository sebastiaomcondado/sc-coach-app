import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WEEKDAY_NAMES } from "@/lib/weekdays";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("program_templates")
    .select("id, name, notes, day_of_week")
    .eq("id", templateId)
    .single();

  if (!template) notFound();

  const { data: exercises } = await supabase
    .from("template_exercises")
    .select("id, section, superset_group, notes, position, exercise:exercises(name, video_url)")
    .eq("template_id", templateId)
    .order("position");

  const { data: phases } = await supabase
    .from("template_exercise_phases")
    .select("*")
    .in("template_exercise_id", (exercises ?? []).map((e) => e.id))
    .order("position");

  return (
    <div>
      <Link href="/coach/templates" className="mb-4 inline-block text-sm text-neutral-400 hover:text-white">
        ← Templates
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{template.name}</h1>
          {template.day_of_week !== null && (
            <p className="mt-1 text-sm text-neutral-400">Scheduled: {WEEKDAY_NAMES[template.day_of_week]}</p>
          )}
          {template.notes && <p className="mt-1 text-sm text-neutral-400">{template.notes}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/coach/templates/${template.id}/edit`}
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            Edit
          </Link>
          <Link
            href={`/coach/workouts/new?template=${template.id}`}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Assign to athlete(s)
          </Link>
        </div>
      </div>

      {!exercises || exercises.length === 0 ? (
        <p className="text-neutral-400">No exercises in this template.</p>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex) => {
            const exercise = Array.isArray(ex.exercise) ? ex.exercise[0] : ex.exercise;
            const exPhases = (phases ?? []).filter((p) => p.template_exercise_id === ex.id);

            return (
              <div key={ex.id} className="rounded-lg border border-neutral-800 p-4">
                <div className="mb-1 flex items-baseline justify-between">
                  <h3 className="font-medium text-white">
                    {ex.superset_group && (
                      <span className="mr-1.5 text-neutral-500">{ex.superset_group}.</span>
                    )}
                    {exercise?.name ?? "Exercise"}
                    {exercise?.video_url && (
                      <a
                        href={exercise.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-xs font-normal text-emerald-400 hover:underline"
                      >
                        ▶ Watch
                      </a>
                    )}
                  </h3>
                  {ex.section && <span className="text-xs text-neutral-500">{ex.section}</span>}
                </div>
                {ex.notes && <p className="mb-2 text-sm text-neutral-400">{ex.notes}</p>}

                {exPhases.length === 0 ? (
                  <p className="text-sm text-neutral-500">No prescription set.</p>
                ) : (
                  <ul className="space-y-1">
                    {exPhases.map((p) => (
                      <li key={p.id} className="text-sm text-neutral-300">
                        {p.label && <span className="text-neutral-500">{p.label}: </span>}
                        {p.sets ?? "–"} x {p.reps ?? "–"}
                        {p.rpe ? ` (RPE ${p.rpe})` : ""}
                        {p.rest ? ` · Rest ${p.rest}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
