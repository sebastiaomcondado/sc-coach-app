import { createClient } from "@/lib/supabase/server";
import { AddExerciseForm } from "@/components/AddExerciseForm";

export default async function ExerciseLibraryPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("name");

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-white">Exercise library</h1>

      <div className="mb-8 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <AddExerciseForm />
      </div>

      {!exercises || exercises.length === 0 ? (
        <p className="text-neutral-400">No exercises yet — add your first one above.</p>
      ) : (
        <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {exercises.map((ex) => (
            <li key={ex.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-white">{ex.name}</span>
                {ex.category && <span className="ml-2 text-sm text-neutral-500">{ex.category}</span>}
              </div>
              {ex.video_url && (
                <a
                  href={ex.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-emerald-400 hover:underline"
                >
                  Video
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
