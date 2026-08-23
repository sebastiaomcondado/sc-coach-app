import Link from "next/link";

export function NavBar({
  links,
  name,
}: {
  links: { href: string; label: string }[];
  name: string;
}) {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-white">S&amp;C Coach</span>
          <nav className="flex gap-4 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-neutral-300 hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <span>{name}</span>
          <form action="/auth/signout" method="post">
            <button className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
