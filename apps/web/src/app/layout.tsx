import type { Metadata, Viewport } from "next";
import { Noto_Serif, Manrope, Noto_Sans_Georgian } from "next/font/google";
import { AuthGuard } from "@/components/AuthGuard";
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
  description: "The Classic Georgian Card Game",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Royal Joker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#001430",
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
      <body className="min-h-full flex flex-col font-body antialiased overscroll-none">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
