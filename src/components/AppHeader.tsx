import Link from "next/link";
import { TrendingUp, LogOut } from "lucide-react";

export function AppHeader({
  title,
  userName,
}: {
  title: string;
  userName?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs font-medium text-[var(--muted)]">Hisab</p>
          <h1 className="text-lg font-bold">{title}</h1>
          {userName && (
            <p className="text-xs text-[var(--muted)]">Hi, {userName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/investments"
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--bg)]"
            aria-label="Investments"
          >
            <TrendingUp size={22} />
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--bg)]"
              aria-label="Sign out"
            >
              <LogOut size={22} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
