import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function BastuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${inter.variable} font-inter`}>{children}</div>;
}
