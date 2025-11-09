// Hook para llamar al backend de BioID con el JWT del localStorage
type Json = Record<string, any>;
const API = (import.meta.env.VITE_API_URL as string).replace(/\/$/, "");

export default function useApi() {
  const get = async <T = any>(path: string): Promise<T> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}${path.startsWith("/") ? "" : "/"}${path}`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error((await res.json())?.message || res.statusText);
    return res.json() as Promise<T>;
  };

  const postJson = async <T = any>(path: string, body?: Json): Promise<T> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}${path.startsWith("/") ? "" : "/"}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error((await res.json())?.message || res.statusText);
    return res.json() as Promise<T>;
  };

  return { get, postJson };
}
