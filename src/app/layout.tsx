import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mapstar — Find lodges in Nigeria. Skip the agent fees.",
  description:
    "Live map of verified lodges and rentals across Nigeria. Green = available now, orange = coming soon. Direct-from-landlord rentals, escrow deposits, e-signed agreements, and capped agent fees.",
  keywords: ["Mapstar", "Nigeria", "Owerri", "Enugu", "lodges", "rent", "self-con", "flats", "students", "FUTO", "IMSU", "UNN", "ESUT"],
  authors: [{ name: "Mapstar" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/icon.svg"],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased min-h-screen bg-[#F8FAFC] dark:bg-[#070A12] text-slate-800 dark:text-slate-100 transition-colors duration-200`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
          <Sonner position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
