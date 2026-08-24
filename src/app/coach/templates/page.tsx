import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export default async function TemplatesPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("program_templates")
    .select("id, name, notes")
    .eq("coach_id", profile!.id)
    .order("name");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Program templates</h1>
        <div className="flex gap-2">
          <Link
            href="/coach/templates/import"
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            Import from Google Sheets
          </Link>
          <Link
            href="/coach/templates/new"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            + New template
          </Link>
        </div>
      </div>

      {!templates || templates.length === 0 ? (
        <p className="text-neutral-400">
          No templates yet.{" "}
          <Link href="/coach/templates/new" className="text-emerald-400 hover:underline">
            Create your first one
          </Link>
          . You&apos;ll be able to start any new workout from a template instead of building it from
          scratch.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {templates.map((t) => (
            <li key={t.id}>
              <Link
                href={`/coach/templates/${t.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900"
              >
                <div>
                  <span className="text-white">{t.name}</span>
                  {t.notes && <p className="mt-1 text-sm text-neutral-500">{t.notes}</p>}
                </div>
                <span className="text-sm text-neutral-500">View →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
