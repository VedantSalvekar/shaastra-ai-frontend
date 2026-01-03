"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  // Don't show auth buttons on login/register pages
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
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
          {isAuthenticated && (
            <>
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
            </>
          )}

          {!isAuthPage && (
            <>
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {user?.email}
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs transition-colors"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-lg hover:bg-slate-800 border border-slate-700 text-xs transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
