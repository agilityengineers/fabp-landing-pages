import type { Metadata } from "next";
import { Newsreader, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "An Invitation — Find a Business Pro",
  description:
    "A category-exclusive listing in the directory business owners search when they need a trusted professional.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://invitation.findabusinesspro.com"
  ),
  icons: {
    icon: "/New-Favicon-2026_1777917096270.png",
    apple: "/New-Favicon-2026_1777917096270.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
