"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);

  // ensure axios sends cookies for same-origin requests
  useEffect(() => {
    try {
      axios.defaults.withCredentials = true;
    } catch {
      // ignore
    }
  }, []);

  // fetch /api/auth/me to validate token and load user
  const fetchMe = async (tkn: string) => {
    try {
      setLoading(true);

      // request includes credentials so server HttpOnly cookie will be sent automatically;
      // also include Authorization header so either method works
      const res = await axios.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${tkn}` },
        withCredentials: true,
      });
      const json = res.data;
      if (res.status === 200 && json.success) {
        setUser({
          id: json.data._id || json.data.id,
          name: json.data.name,
          email: json.data.email,
          phone: json.data.phone,
          role: json.data.role,
        });
      } else {
        // invalid token -> logout
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
      }
    } catch (err) {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMe(token);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      setLoading(true);
      // include credentials so browser accepts any Set-Cookie from server
      const res = await axios.post(
        "/api/auth/login",
        { identifier, password },
        { withCredentials: true }
      );
      const json = res.data;
      if (res.status === 200 && json.success && json.data?.token) {
        const tkn = json.data.token;
        // store token in localStorage for client-side fetchers
        localStorage.setItem("token", tkn);
        setToken(tkn);

        // set axios defaults so subsequent axios calls include credentials and Authorization
        try {
          axios.defaults.withCredentials = true;
          axios.defaults.headers = axios.defaults.headers || {};
          axios.defaults.headers.common = axios.defaults.headers.common || {};
          axios.defaults.headers.common["Authorization"] = `Bearer ${tkn}`;
        } catch {
          /* ignore */
        }

        // set user from response if present
        if (json.data.user) setUser(json.data.user);
        else await fetchMe(tkn);
        return { success: true };
      }
      return { success: false, error: json.error || "Login failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
