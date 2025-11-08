import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Enroll() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [biometricHash, setBiometricHash] = useState<string | null>(null);

  const enroll = async () => {
    try {
      setBusy(true);
      setMsg(null);
      setErr(null);

      // 1) pedir opciones de registro
      const res1 = await fetch("/api/bioid/start-enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.email || "demo@user" }),
      });
      if (!res1.ok) throw new Error(await res1.text());
      const { options, token } = await res1.json();

      // 2) lanzar WebAuthn (platform authenticator)
      const cred: any = await navigator.credentials.create({ publicKey: options });
      if (!cred) throw new Error("No credential returned");

      // serializar para enviar al backend
      const attResp = {
        id: cred.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(cred.rawId))),
        type: cred.type,
        response: {
          attestationObject: btoa(
            String.fromCharCode(...new Uint8Array(cred.response.attestationObject))
          ),
          clientDataJSON: btoa(
            String.fromCharCode(...new Uint8Array(cred.response.clientDataJSON))
          ),
        },
        clientExtensionResults: cred.getClientExtensionResults?.() || {},
      };

      // 3) finalizar registro
      const res2 = await fetch("/api/bioid/finish-enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user?.email || "demo@user", attestation: attResp }),
      });
      if (!res2.ok) throw new Error(await res2.text());
      const out = await res2.json();

      setMsg("✅ Biometric enrollment completed.");
      setBiometricHash(out.biometricHash);
    } catch (e: any) {
      setErr(e?.message || "Enrollment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-semibold mb-3">Enroll biometric</h1>
      <p className="text-sm text-udo-steel mb-4">
        This registers a platform authenticator (Face/Touch ID). We store only a hash of the credential ID.
      </p>
      <button
        onClick={enroll}
        disabled={busy}
        className="w-full rounded-xl px-4 py-3 bg-udo-primary text-white"
      >
        {busy ? "Registering…" : "Register Face / Fingerprint"}
      </button>

      {msg && <p className="mt-4 text-green-600 text-sm">{msg}</p>}
      {err && <p className="mt-4 text-red-600 text-sm">{err}</p>}

      {biometricHash && (
        <div className="mt-4 p-3 bg-gray-50 border rounded-xl text-xs break-all">
          <div className="font-semibold mb-1">biometricHash (sha256(credentialId))</div>
          <div>{biometricHash}</div>
          <div className="mt-2 italic text-udo-steel">
            → Guarda esto en Wallet2 como identidad biométrica.
          </div>
        </div>
      )}
    </div>
  );
}
