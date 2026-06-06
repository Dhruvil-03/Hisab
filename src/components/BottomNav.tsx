"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Wallet, Users, List } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/add", label: "Add", icon: PlusCircle },
  { href: "/receivables", label: "Owed", icon: Users },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/transactions", label: "History", icon: List },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg justify-around px-1 py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium ${
                active ? "text-[var(--primary)]" : "text-[var(--muted)]"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
