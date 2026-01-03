"use client";

import { useState, useEffect } from "react";
import {
  getCurrentUser,
  getAuthToken,
  clearAuthToken,
  type UserRead,
  ApiError,
} from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const token = getAuthToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Token is invalid, clear it
          clearAuthToken();
        }
        setError(err instanceof Error ? err.message : "Failed to load user");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const logout = () => {
    clearAuthToken();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
  };
}
