import React from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminContext } from "@/lib/admin/context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, orgLabel, orgHint, roleLabel, navItems, canSearchCandidates } =
    await requireAdminContext();

  return (
    <AdminShell
      orgLabel={orgLabel}
      orgHint={orgHint}
      userName={session.name || session.email}
      userRoleLabel={roleLabel}
      navItems={navItems}
      canSearchCandidates={canSearchCandidates}
    >
      {children}
    </AdminShell>
  );
}
