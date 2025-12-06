import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-950 text-slate-100 antialiased`}
      >
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
          <header className="border-b border-slate-900/70">
            <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-lg font-semibold"
              >
                <span className="text-emerald-400">Shaastra</span>
                <span className="text-slate-300">AI</span>
              </Link>
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <Link
                  href="/dashboard"
                  className="hover:text-emerald-300 transition-colors"
                >
                  Assistant
                </Link>
                <Link
                  href="/documents"
                  className="hover:text-emerald-300 transition-colors"
                >
                  Documents
                </Link>
              </div>
            </nav>
          </header>
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
      </body>
    </html>
  );
}
