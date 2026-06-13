import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LayoutClient } from "@/components/layout-client";
import { siteContent } from "@/theme/site-content";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteContent.meta.title,
    template: `%s | ${siteContent.brand.name}`,
  },
  description: siteContent.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className={inter.variable}>
      <body className="min-h-screen bg-brand-bg font-sans text-brand-text antialiased">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
