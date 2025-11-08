import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "../ui/Button";
import Loader from "../ui/Loader";

export default function Enroll() {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleEnroll = async () => {
    try {
      setBusy(true);
      setStatus("Requesting biometric registration…");

      // 🧠 Llama al navegador para crear credencial WebAuthn
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: "UDoChain BioID" },
          user: {
            id: new TextEncoder().encode(user.email),
            name: user.email,
            displayName: user.email,
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: { userVerification: "preferred" },
          timeout: 60000,
          attestation: "none",
        },
      });

      console.log("✅ Credential:", credential);
      setStatus("Biometric successfully registered!");
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Registration failed or canceled.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-3xl font-bold text-udo-primary mb-3">
        Register Biometric ID
      </h1>
      <p className="text-gray-600 mb-6">
        Use your device’s Face ID or fingerprint to create a secure BioID.
      </p>

      <Button onClick={handleEnroll} disabled={busy}>
        {busy ? "Processing..." : "Enroll Biometric"}
      </Button>

      {status && (
        <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">{status}</p>
      )}

      <button
        onClick={logout}
        className="text-sm text-red-500 mt-6 underline hover:text-red-600"
      >
        Logout
      </button>
    </div>
  );
}
