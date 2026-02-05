import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import { LayoutClient } from "@/components/layout-client";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Bokningssystem",
  description: "Boka enkelt och smidigt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className={`${playfair.variable} ${montserrat.variable}`}>
      <body className="antialiased">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
