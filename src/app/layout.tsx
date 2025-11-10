import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import React from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { AppProviders } from "@/components/AppProviders";
import { AuthProvider } from "@/contexts/AuthContext"; // new

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shubham Jewellers - Billing & Management System",
  description:
    "Complete jewelry billing and management solution for gold, silver, platinum jewelry with GST compliance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {/* Inline script to set html.dark early to avoid FOUC.
            It respects localStorage.theme = "light"|"dark" or falls back to system preference.
            Keep this small and synchronous so it runs before React hydration. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var ls = null;
                  try { ls = localStorage.getItem('theme'); } catch (e) {}
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var useDark = ls === 'dark' || (ls === null && prefersDark);
                  if (useDark) document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                } catch (e) {
                  // noop
                }
              })();
            `,
          }}
        />

        <AppProviders>
          <AuthProvider>{children}</AuthProvider>
        </AppProviders>
      </body>
    </html>
  );
}
