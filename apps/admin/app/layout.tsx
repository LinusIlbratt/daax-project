import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin – Forshälla Alltjänst",
  description: "Administration av maskinuthyrning och bokningar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
