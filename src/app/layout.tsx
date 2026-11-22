import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mapstar — Find lodges in Nigeria. Skip the agent fees.",
  description:
    "Live map of available lodges in Imo and Enugu. Green = available now, orange = coming soon. Direct-from-landlord rentals, escrow deposits, e-signed agreements, and capped agent fees.",
  keywords: ["Mapstar", "Nigeria", "Owerri", "Enugu", "lodges", "rent", "self-con", "flats", "students", "FUTO", "IMSU", "UNN", "ESUT"],
  authors: [{ name: "Mapstar" }],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#070A12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-[#070A12] text-slate-100 min-h-screen`}
      >
        {children}
        <Toaster />
        <Sonner position="top-right" richColors />
      </body>
    </html>
  );
}
