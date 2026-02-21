"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api/auth";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

const NO_SHELL_PATHS = ["/"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
  });
  const email = data?.email ?? data?.user?.email ?? null;
  const showShell = pathname != null && !NO_SHELL_PATHS.includes(pathname);

  if (!showShell) {
    return <>{children}</>;
  }
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar email={email} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
