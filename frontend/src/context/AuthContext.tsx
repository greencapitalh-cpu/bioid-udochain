// AuthContext: valida JWT recibido desde app.udochain.com (token via URL o localStorage)
// Verifica /api/auth/me en la API central para bloquear rutas del módulo.
import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  _id: string;
  email: string;
  username?: string;
};

type Ctx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  logout: () => void;
};

const AuthContext = createContext<Ctx>({ user: null, token: null, loading: true, logout: () => {} });

const CORE_API = import.meta.env.VITE_CORE_API as string;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // 1) Lee token de ?token= o localStorage
      const params = new URLSearchParams(window.location.search);
      const tUrl = params.get("token");
      const tStored = localStorage.getItem("token");
      const active = tUrl || tStored || null;

      if (tUrl) {
        localStorage.setItem("token", tUrl);
        // limpia querystring
        window.history.replaceState({}, "", window.location.pathname);
      }
      setToken(active);

      if (!active) {
        setUser(null);
        setLoading(false);
        return;
      }

      // 2) Verifica usuario con API central (/auth/me)
      try {
        const res = await fetch(`${CORE_API.replace(/\/$/, "")}/auth/me`, {
          headers: { Authorization: `Bearer ${active}` }
        });
        if (!res.ok) throw new Error("Unauthorized");
        const me = (await res.json()) as User;
        if (!me?._id) throw new Error("Invalid payload");
        setUser(me);
      } catch (e) {
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    window.location.href = "https://app.udochain.com/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
