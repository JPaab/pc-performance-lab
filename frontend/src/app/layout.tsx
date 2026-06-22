import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PC Performance Lab",
    template: "%s | PC Performance Lab",
  },
  description:
    "A benchmark and tuning dashboard for PC hardware snapshots, CapFrameX runs, HWiNFO sensor logs and tweak comparisons.",
  applicationName: "PC Performance Lab",
  keywords: [
    "PC performance",
    "benchmark dashboard",
    "CapFrameX",
    "HWiNFO",
    "gaming PC tuning",
    "frametime analysis",
    "FPS comparison",
  ],
};

export const viewport: Viewport = {
  themeColor: "#05020a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#05020a] text-zinc-100 selection:bg-violet-300 selection:text-black">
        {children}
      </body>
    </html>
  );
}
