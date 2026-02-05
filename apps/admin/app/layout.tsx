import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Package,
  Settings,
  Truck,
  User,
  FileText,
} from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin – Bokningssystem",
  description: "Administration av bokningssystemet",
};

const SIDEBAR_LINKS = [
  { href: "/", label: "Översikt", icon: LayoutDashboard },
  { href: "/bookings", label: "Bokningar", icon: CalendarDays },
  { href: "/calendar", label: "Kalender", icon: CalendarRange },
  { href: "/logistics", label: "Logistik", icon: Truck },
  { href: "/inventory", label: "Maskinpark", icon: Package },
  { href: "/avtal", label: "Avtal", icon: FileText },
  { href: "/settings", label: "Inställningar", icon: Settings },
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="antialiased">
        <div className="flex min-h-screen bg-slate-100">
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 z-10 flex h-full w-56 flex-col border-r border-slate-700 bg-slate-800 text-slate-200">
            <div className="flex h-14 items-center border-b border-slate-700 px-4">
              <span className="font-semibold text-white">Admin</span>
            </div>
            <nav className="flex-1 space-y-0.5 p-3">
              {SIDEBAR_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  {label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main area */}
          <div className="flex flex-1 flex-col pl-56">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-14 items-center justify-end border-b border-slate-200 bg-white px-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="h-4 w-4" aria-hidden />
                <span>Admin</span>
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
