"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_PROXY_PATH, readApiJson } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const apiUrl = API_PROXY_PATH;
    fetch(`${apiUrl}/auth/me`, { credentials: "include" })
      .then(async response => {
        if (!response.ok) return null;
        return response.json();
      })
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email, password) => {
    const apiUrl = API_PROXY_PATH;
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await readApiJson(response);
    if (!response.ok) throw new Error(data.error || "Login failed");

    const nextUser = data.user;
    setUser(nextUser);

    return data;
  };

  const signup = async ({ email, password, full_name, phone }) => {
    const apiUrl = API_PROXY_PATH;
    const response = await fetch(`${apiUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, full_name, phone }),
    });

    const data = await readApiJson(response);
    if (!response.ok) throw new Error(data.error || "Signup failed");

    const nextUser = data.user;
    setUser(data.requiresEmailConfirmation ? null : nextUser);

    return data;
  };

  const logout = async () => {
    const apiUrl = API_PROXY_PATH;
    await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
    setUser(null);
  };

  const startGoogleSignIn = async () => {
    const apiUrl = API_PROXY_PATH;
    const response = await fetch(`${apiUrl}/auth/social/google`, {
      credentials: "include",
    });
    const data = await readApiJson(response);
    if (!response.ok)
      throw new Error(data.error || "Unable to start Google sign-in");
    window.location.assign(data.url);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      signup,
      startGoogleSignIn,
      logout,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
