// Lógica WebAuthn con @simplewebauthn/server
// Nota: guardamos challenges en memoria para simplificar (puedes moverlo a Redis si quieres).
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";
import crypto from "crypto";

const rpID = process.env.RP_ID;
const rpName = process.env.RP_NAME || "UDoChain BioID";
const origin = process.env.ORIGIN;

if (!rpID || !origin) {
  throw new Error("Missing RP_ID or ORIGIN env vars");
}

// Store mínimo de challenges por usuario (memoria)
const challengeStore = new Map(); // key: userId -> { regChallenge, authChallenge }

export function createRegOptions(existingIds = []) {
  // excludeCredentials evita registrar duplicado en el mismo dispositivo
  return generateRegistrationOptions({
    rpID,
    rpName,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform"
    },
    excludeCredentials: existingIds.map(id => ({
      id: Buffer.from(id, "base64url"),
      type: "public-key",
      transports: ["internal"]
    }))
  });
}

export async function verifyRegResponse(userId, email, response) {
  const expectedChallenge = challengeStore.get(userId)?.regChallenge;
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true
  });
  return verification;
}

export function createAuthOptions(allowIds = []) {
  return generateAuthenticationOptions({
    rpID,
    allowCredentials: allowIds.map(id => ({
      id: Buffer.from(id, "base64url"),
      type: "public-key",
      transports: ["internal"]
    })),
    userVerification: "required"
  });
}

export async function verifyAuthResponse(userId, response, currentCounter = 0) {
  const expectedChallenge = challengeStore.get(userId)?.authChallenge;
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    authenticator: {
      // dummy authenticator; counter se chequea dentro de rutas con el stored
      credentialID: Buffer.from(response?.id || "", "base64url"),
      credentialPublicKey: new Uint8Array(),
      counter: currentCounter
    }
  });
  return verification;
}

export function setRegChallenge(userId, challenge) {
  const rec = challengeStore.get(userId) || {};
  rec.regChallenge = challenge;
  challengeStore.set(userId, rec);
}

export function setAuthChallenge(userId, challenge) {
  const rec = challengeStore.get(userId) || {};
  rec.authChallenge = challenge;
  challengeStore.set(userId, rec);
}

export function hashForWallet2(credentialId) {
  return crypto.createHash("sha256").update(credentialId).digest("hex");
}
