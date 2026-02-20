"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/api/auth";

export function Navbar({ email }: { email: string | null }) {
  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="font-semibold text-foreground">
          VSA Console
        </Link>
        <div className="flex items-center gap-3">
          {email && (
            <span className="text-sm text-muted-foreground">{email}</span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
