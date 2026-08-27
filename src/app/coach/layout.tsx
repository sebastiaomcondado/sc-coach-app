import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "coach") redirect("/athlete");

  return (
    <div className="min-h-screen bg-neutral-950">
      <NavBar
        name={profile.full_name}
        links={[
          { href: "/coach", label: "Roster" },
          { href: "/coach/groups", label: "Groups" },
          { href: "/coach/calendar", label: "Calendar" },
          { href: "/coach/workouts/new", label: "New workout" },
          { href: "/coach/templates", label: "Templates" },
          { href: "/coach/cycles", label: "Cycles" },
          { href: "/coach/exercises", label: "Exercise library" },
          { href: "/coach/reports", label: "Reports" },
        ]}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
