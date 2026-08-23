import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";

export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "athlete") redirect("/coach");

  return (
    <div className="min-h-screen bg-neutral-950">
      <NavBar
        name={profile.full_name}
        links={[
          { href: "/athlete", label: "My workouts" },
          { href: "/athlete/calendar", label: "Calendar" },
          { href: "/athlete/progress", label: "My progress" },
          { href: "/athlete/metrics", label: "Body metrics" },
          { href: "/athlete/profile", label: "My profile" },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
