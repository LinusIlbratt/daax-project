import { Arvo, Inter } from "next/font/google";

const arvo = Arvo({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-arvo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function MaskinerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${arvo.variable} ${inter.variable} font-inter`}>
      {children}
    </div>
  );
}
