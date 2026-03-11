import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-shippori",
});

export const metadata: Metadata = {
  title: "G-OS | MY ONLY FRAGRANCE",
  description: "次世代経営OS - オーダーメイドフレグランス",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${cormorant.variable} ${dmSans.variable} ${shipporiMincho.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-offwhite text-warmInk">
        {children}
      </body>
    </html>
  );
}
