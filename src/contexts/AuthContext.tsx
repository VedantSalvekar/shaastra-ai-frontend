"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCurrentUser,
  getAuthToken,
  clearAuthToken,
  setAuthToken as saveAuthToken,
  type UserRead,
  ApiError,
} from "@/lib/api";

type AuthContextType = {
  user: UserRead | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = async () => {
    const token = getAuthToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await getCurrentUser(token);
      setUser(userData);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthToken();
      }
      setError(err instanceof Error ? err.message : "Failed to load user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (token: string) => {
    saveAuthToken(token);
    setLoading(true);
    await loadUser();
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
