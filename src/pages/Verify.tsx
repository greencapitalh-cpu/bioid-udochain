import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "../ui/Button";
import Loader from "../ui/Loader";

export default function Verify() {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleVerify = async () => {
    try {
      setBusy(true);
      setStatus("Waiting for biometric verification…");

      // ✅ WebAuthn: autenticar usando biometría
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: "preferred",
        },
      });

      console.log("✅ Assertion:", assertion);
      setStatus("Identity successfully verified!");
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Verification failed or canceled.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-3xl font-bold text-udo-primary mb-3">
        Verify Your Identity
      </h1>
      <p className="text-gray-600 mb-6">
        Confirm your identity using your registered biometric credential.
      </p>

      <Button onClick={handleVerify} disabled={busy}>
        {busy ? "Verifying..." : "Verify Now"}
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
