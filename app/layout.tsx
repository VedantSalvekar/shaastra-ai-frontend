import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shaastra AI",
  description: "AI assistant for Irish legal and admin documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-screen overflow-hidden bg-slate-950 text-slate-100 antialiased`}
      >
        <AuthProvider>
          <div className="flex flex-col h-screen bg-gradient-to-b from-slate-950 to-slate-900">
            <NavBar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-900/70 text-xs text-slate-400">
              <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-center">
                <span>© 2024 Shaastra AI</span>
                <span className="text-slate-500">
                  Built to clarify Irish admin docs. Not legal advice.
                </span>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
