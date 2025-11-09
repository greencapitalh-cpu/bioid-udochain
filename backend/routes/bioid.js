// Endpoints BioID: requieren JWT válido (mismo JWT_SECRET que api.udochain.com)
// Flujo WebAuthn: enroll/start, enroll/finish, verify/start, verify/finish
import express from "express";
import jwt from "jsonwebtoken";
import BioCredential from "../models/BioCredential.js";
import {
  createRegOptions, verifyRegResponse,
  createAuthOptions, verifyAuthResponse,
  setRegChallenge, setAuthChallenge, hashForWallet2
} from "../lib/webauthn.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware: valida Authorization: Bearer <token>
router.use((req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email || payload.username || "" };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// POST /api/bioid/webauthn/enroll/start
router.post("/webauthn/enroll/start", async (req, res) => {
  const userId = String(req.user.id);
  const email = req.user.email;

  // Obtiene credenciales existentes para excluirlas del create()
  const existing = await BioCredential.find({ userId });
  const existingIds = existing.map(c => c.credentialId);

  const opts = createRegOptions(existingIds);
  // El user info para display (no se guarda biometría)
  opts.user = {
    id: Buffer.from(userId),
    name: email || `user-${userId}`,
    displayName: email || `user-${userId}`
  };

  setRegChallenge(userId, opts.challenge);
  return res.json(opts);
});

// POST /api/bioid/webauthn/enroll/finish
router.post("/webauthn/enroll/finish", async (req, res) => {
  const userId = String(req.user.id);
  const email = req.user.email;

  try {
    const verification = await verifyRegResponse(userId, email, req.body);
    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return res.status(400).json({ message: "Registration not verified" });
    }

    const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } =
      registrationInfo;

    const credentialId = Buffer.from(credentialID).toString("base64url");
    const publicKey = Buffer.from(credentialPublicKey).toString("base64");
    const wallet2Hash = hashForWallet2(credentialId);

    await BioCredential.findOneAndUpdate(
      { credentialId },
      {
        userId,
        email,
        credentialId,
        publicKey,
        counter: counter || 0,
        transports: ["internal"],
        wallet2Hash,
        lastUsedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Aquí podrías notificar a Wallet2 con wallet2Hash si deseas
    return res.json({ ok: true, message: "Enrolled", wallet2Hash });
  } catch (e) {
    console.error("Enroll finish error:", e);
    return res.status(400).json({ message: "Invalid registration response" });
  }
});

// POST /api/bioid/webauthn/verify/start
router.post("/webauthn/verify/start", async (req, res) => {
  const userId = String(req.user.id);
  const creds = await BioCredential.find({ userId });
  if (!creds.length) return res.status(404).json({ message: "No credentials registered" });

  const allowIds = creds.map(c => c.credentialId);
  const opts = createAuthOptions(allowIds);
  setAuthChallenge(userId, opts.challenge);
  return res.json(opts);
});

// POST /api/bioid/webauthn/verify/finish
router.post("/webauthn/verify/finish", async (req, res) => {
  const userId = String(req.user.id);
  const email = req.user.email;

  try {
    // Determina el credentialId invocado
    const credId = req.body?.id;
    if (!credId) return res.status(400).json({ message: "Missing credential id" });

    const cred = await BioCredential.findOne({ credentialId: credId, userId });
    if (!cred) return res.status(404).json({ message: "Credential not found" });

    const verification = await verifyAuthResponse(userId, req.body, cred.counter || 0);
    const { verified, authenticationInfo } = verification;

    if (!verified || !authenticationInfo) {
      return res.status(400).json({ message: "Authentication failed" });
    }

    // Actualiza counter (protege contra replay attacks)
    cred.counter = authenticationInfo.newCounter ?? cred.counter;
    cred.lastUsedAt = new Date();
    await cred.save();

    return res.json({ ok: true, message: "Verified", credentialId: credId, wallet2Hash: cred.wallet2Hash });
  } catch (e) {
    console.error("Verify finish error:", e);
    return res.status(400).json({ message: "Invalid authentication response" });
  }
});

export default router;
