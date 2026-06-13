"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogisticsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="flex min-h-[200px] items-center justify-center text-[rgb(var(--admin-text-muted))]">
      Omdirigerar till Översikt…
    </div>
  );
}
