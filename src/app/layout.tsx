import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";
import type { ReactNode } from "react";
import { MarketingNav } from "@/components/layout/MarketingNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fund Sim",
  description: "Model cap tables across funding rounds and see how much each founder would make at exit",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <MarketingNav />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
