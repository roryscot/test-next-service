"use client";
import { PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Home } from "lucide-react";
import clsx from "clsx";

export function AppShell({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/call", label: "Interview", icon: Mic },
  ];

  return (
    <div className="bg-bg min-h-dvh">
      <header className="bg-bg/80 border-border sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-primary-foreground text-sm font-bold">
                  S
                </span>
              </div>
              <span className="text-fg text-xl font-bold">Strella</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "duration-fast flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                      {
                        "bg-primary/10 text-primary": isActive,
                        "text-muted-foreground hover:text-fg hover:bg-muted/30":
                          !isActive,
                      }
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile menu button */}
            <button className="text-muted-foreground hover:text-fg hover:bg-muted/30 duration-fast rounded-lg p-2 transition-colors md:hidden">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {title && (
          <div className="mb-8">
            <h1 className="text-fg text-3xl font-bold">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
