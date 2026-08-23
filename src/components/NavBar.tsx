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
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white">S&amp;C Coach</span>
          <div className="flex items-center gap-3 text-sm text-neutral-400">
            <span className="max-w-[40vw] truncate sm:max-w-none">{name}</span>
            <form action="/auth/signout" method="post">
              <button className="shrink-0 rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800">
                Log out
              </button>
            </form>
          </div>
        </div>
        <nav className="mt-2 flex gap-4 overflow-x-auto text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 whitespace-nowrap text-neutral-300 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
