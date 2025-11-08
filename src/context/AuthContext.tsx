import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get("token");
      const local = localStorage.getItem("token");
      const activeToken = tokenFromUrl || local;

      if (tokenFromUrl) {
        localStorage.setItem("token", tokenFromUrl);
        window.history.replaceState({}, "", window.location.pathname);
      }

      if (!activeToken) {
        setLoading(false);
        return;
      }

      setToken(activeToken);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${activeToken}` }
        });

        if (!res.ok) throw new Error("Invalid token");

        const me = await res.json();
        setUser(me);
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
