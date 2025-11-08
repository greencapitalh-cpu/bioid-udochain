import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Verify() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const verify = async () => {
    try {
      setBusy(true);
      setMsg(null);
      setErr(null);

      // 1) pedir opciones de autenticación
      const res1 = await fetch("/api/bioid/start-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.email || "demo@user" }),
      });
      if (!res1.ok) throw new Error(await res1.text());
      const { options, token } = await res1.json();

      const allowList = options.allowCredentials?.map((c: any) => ({
        ...c,
        id: Uint8Array.from(atob(c.id), (c) => c.charCodeAt(0)),
      }));

      const publicKey = { ...options, allowCredentials: allowList };

      // 2) WebAuthn get()
      const assertion: any = await navigator.credentials.get({ publicKey });
      if (!assertion) throw new Error("No assertion returned");

      const authResp = {
        id: assertion.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
        type: assertion.type,
        response: {
          authenticatorData: btoa(
            String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))
          ),
          clientDataJSON: btoa(
            String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))
          ),
          signature: btoa(
            String.fromCharCode(...new Uint8Array(assertion.response.signature))
          ),
          userHandle: assertion.response.userHandle
            ? btoa(String.fromCharCode(...new Uint8Array(assertion.response.userHandle)))
            : null,
        },
        clientExtensionResults: assertion.getClientExtensionResults?.() || {},
      };

      // 3) finalizar verificación
      const res2 = await fetch("/api/bioid/finish-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user?.email || "demo@user", assertion: authResp }),
      });
      if (!res2.ok) throw new Error(await res2.text());
      const out = await res2.json();

      setMsg(out?.verified ? "✅ Identity verified." : "❌ Not verified.");
    } catch (e: any) {
      setErr(e?.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-semibold mb-3">Verify identity</h1>
      <p className="text-sm text-udo-steel mb-4">
        Uses the registered Face/Touch ID credential to authenticate the user.
      </p>
      <button
        onClick={verify}
        disabled={busy}
        className="w-full rounded-xl px-4 py-3 bg-udo-primary text-white"
      >
        {busy ? "Verifying…" : "Verify now"}
      </button>

      {msg && <p className="mt-4 text-green-600 text-sm">{msg}</p>}
      {err && <p className="mt-4 text-red-600 text-sm">{err}</p>}
    </div>
  );
}
