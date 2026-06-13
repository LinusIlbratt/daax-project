"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
