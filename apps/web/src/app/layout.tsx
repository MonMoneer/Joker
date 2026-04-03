import type { Metadata } from "next";
import { Noto_Serif, Manrope, Noto_Sans_Georgian } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoGeorgian = Noto_Sans_Georgian({
  variable: "--font-georgian",
  subsets: ["georgian"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Royal Joker | ჯოკერი",
  description:
    "Play the classic Georgian card game online with friends or against AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSerif.variable} ${manrope.variable} ${notoGeorgian.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-body antialiased">
        {children}
      </body>
    </html>
  );
}
