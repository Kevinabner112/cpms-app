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

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "CPMS - Far East Seating",
  description: "Color Panel Monitoring System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CPMS",
  },
};

import { ClientOnly } from "@/components/ClientOnly";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex bg-slate-50 text-slate-900" suppressHydrationWarning>
        <div className="flex w-full min-h-screen">
          <ClientOnly>
            {children}
          </ClientOnly>
        </div>
      </body>
    </html>
  );
}
