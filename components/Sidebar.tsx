"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, CalendarDays, Webhook } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: Calendar },
  { href: "/events", label: "Events", icon: CalendarDays },
  ...(process.env.NEXT_PUBLIC_SHOW_WEBHOOK_TESTER === "true"
    ? [{ href: "/webhook-tester", label: "Webhook Tester", icon: Webhook }]
    : []),
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 border-r border-border bg-muted/30 p-3">
      <nav className="flex flex-col gap-0.5">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
