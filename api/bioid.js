// =======================================================
// 🧬 /api/bioid.js — WebAuthn backend para BioID (UDoChain)
// =======================================================
import express from "express";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import crypto from "crypto";

const router = express.Router();

// 🧩 Base de datos en memoria (puedes reemplazar por MongoDB)
const users = new Map();

// =======================================================
// 🔐 1. Iniciar registro biométrico
// =======================================================
router.post("/register/start", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, message: "Email required" });

  const options = generateRegistrationOptions({
    rpName: "UDoChain BioID",
    rpID: "bioid.udochain.com",
    userID: email,
    userName: email,
    attestationType: "none",
    authenticatorSelection: { userVerification: "preferred" },
  });

  // Guardar desafío temporal
  users.set(email, { challenge: options.challenge });
  res.json({ ok: true, options });
});

// =======================================================
// 🔏 2. Completar registro y guardar hash
// =======================================================
router.post("/register/finish", async (req, res) => {
  const { email, attResp } = req.body;
  const record = users.get(email);
  if (!record) return res.status(400).json({ ok: false, message: "Session not found" });

  try {
    const verification = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge: record.challenge,
      expectedOrigin: "https://bioid.udochain.com",
      expectedRPID: "bioid.udochain.com",
    });

    if (!verification.verified) throw new Error("Verification failed");

    // Guardar credencial
    const credId = verification.registrationInfo.credentialID;
    const hash = crypto.createHash("sha256").update(credId).digest("hex");

    users.set(email, { ...record, credentialID: credId, credentialHash: hash });
    res.json({ ok: true, credentialHash: hash });
  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, message: err.message });
  }
});

// =======================================================
// ✅ 3. Iniciar verificación biométrica
// =======================================================
router.post("/verify/start", (req, res) => {
  const { email } = req.body;
  const record = users.get(email);
  if (!record) return res.status(404).json({ ok: false, message: "User not registered" });

  const options = generateAuthenticationOptions({
    rpID: "bioid.udochain.com",
    userVerification: "preferred",
  });

  users.set(email, { ...record, challenge: options.challenge });
  res.json({ ok: true, options });
});

// =======================================================
// 🔍 4. Completar verificación biométrica
// =======================================================
router.post("/verify/finish", async (req, res) => {
  const { email, authResp } = req.body;
  const record = users.get(email);
  if (!record) return res.status(404).json({ ok: false, message: "User not found" });

  try {
    const verification = await verifyAuthenticationResponse({
      response: authResp,
      expectedChallenge: record.challenge,
      expectedOrigin: "https://bioid.udochain.com",
      expectedRPID: "bioid.udochain.com",
      authenticator: {
        credentialPublicKey: record.credentialPublicKey,
        credentialID: record.credentialID,
        counter: 0,
      },
    });

    if (!verification.verified) throw new Error("Authentication failed");

    res.json({ ok: true, verified: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, message: err.message });
  }
});

export default router;
