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
          { href: "/athlete/progress", label: "My progress" },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
