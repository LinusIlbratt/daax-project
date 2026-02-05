"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";

  if (isHome) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex-1 overflow-hidden">{children}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
