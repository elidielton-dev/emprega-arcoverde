import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { ROLE_LABELS, canManageUsers, type UserRole } from "@/lib/auth/rbac";
import { UsersBoard, type AdminUserRow } from "@/components/admin/UsersBoard";

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: { erro?: string; sucesso?: string };
}) {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const rows: AdminUserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    roleLabel: ROLE_LABELS[u.role as UserRole] || u.role,
    createdAt: u.createdAt.toISOString(),
    canDelete: ["ASSISTED_OPERATOR", "ACA_ADMIN", "MUNICIPAL_ADMIN"].includes(u.role),
  }));

  return (
    <UsersBoard
      users={rows}
      currentUserId={session.userId}
      error={searchParams.erro}
      success={Boolean(searchParams.sucesso)}
    />
  );
}
