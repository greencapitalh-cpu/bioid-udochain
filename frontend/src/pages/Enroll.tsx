// Enroll: flujo WebAuthn (create) usando @simplewebauthn/browser
import { startRegistration } from "@simplewebauthn/browser";
import useApi from "../hooks/useApi";
import { useState } from "react";
import Button from "../ui/Button";

export default function Enroll() {
  const api = useApi();
  const [status, setStatus] = useState<string>("");

  const enroll = async () => {
    setStatus("Requesting options...");
    // 1) start
    const options = await api.postJson("/bioid/webauthn/enroll/start");

    // 2) navigator.credentials.create
    setStatus("Waiting for device (Touch ID / Face ID)...");
    const attResp = await startRegistration(options);

    // 3) finish
    setStatus("Finalizing enrollment...");
    const res = await api.postJson("/bioid/webauthn/enroll/finish", attResp);

    setStatus(res?.message || "Enrolled");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full card p-8 text-center">
        <h2 className="text-2xl font-semibold mb-2 text-udo-primary">Enroll Biometric</h2>
        <p className="text-sm text-udo-steel mb-6">
          Register a platform authenticator on this device (fingerprint or face).
        </p>
        <Button onClick={enroll}>Start Enrollment</Button>
        {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
      </div>
    </div>
  );
}
