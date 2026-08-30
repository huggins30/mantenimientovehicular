// ============================================================
// LAYOUT: Panel de Administración
// app/admin/layout.tsx — Server Component
// ============================================================

import { redirect } from "next/navigation";
import { isAdminUser } from "@/app/actions/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await isAdminUser();

  if (!isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}
