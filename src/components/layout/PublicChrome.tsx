"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type User = { name: string; email: string; role: string } | null;

export function PublicChrome({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAppShell = pathname.startsWith("/empresa") || pathname.startsWith("/admin");

  if (isAppShell) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
