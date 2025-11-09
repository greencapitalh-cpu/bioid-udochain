// Verify: flujo WebAuthn (get) para autenticar
import { startAuthentication } from "@simplewebauthn/browser";
import useApi from "../hooks/useApi";
import { useState } from "react";
import Button from "../ui/Button";

export default function Verify() {
  const api = useApi();
  const [status, setStatus] = useState<string>("");

  const verify = async () => {
    setStatus("Requesting options...");
    // 1) start
    const options = await api.postJson("/bioid/webauthn/verify/start");

    // 2) navigator.credentials.get
    setStatus("Authenticating on device...");
    const asseResp = await startAuthentication(options);

    // 3) finish
    setStatus("Verifying assertion...");
    const res = await api.postJson("/bioid/webauthn/verify/finish", asseResp);

    setStatus(res?.message || "Verified");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full card p-8 text-center">
        <h2 className="text-2xl font-semibold mb-2 text-udo-primary">Verify Identity</h2>
        <p className="text-sm text-udo-steel mb-6">
          Authenticate with your registered device.
        </p>
        <Button onClick={verify}>Start Verification</Button>
        {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
      </div>
    </div>
  );
}
