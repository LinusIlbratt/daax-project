import { redirect } from "next/navigation";
import { AdminShell } from "../components/AdminShell";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminHeader } from "../components/AdminHeader";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/supabase/user-roles";

export const dynamic = "force-dynamic";

export default async function AdminAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if ("error" in getSupabasePublicConfig()) {
    redirect("/login?error=config");
  }

  let userEmail: string | null = null;
  try {
    const supabase = await getSupabaseServerClient();
    const session = await getCurrentUserRole(supabase);
    if (!session) {
      redirect("/login");
    }
    if (session.role !== "ADMIN") {
      await supabase.auth.signOut();
      redirect("/login?error=unauthorized");
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch (e) {
    console.error("admin layout: supabase", e);
    redirect("/login?error=config");
  }

  return (
    <AdminShell>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <AdminHeader userEmail={userEmail ?? ""} />
          <main className="flex-1 p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </AdminShell>
  );
}
