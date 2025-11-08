// Vercel Serverless API (CommonJS para compatibilidad)
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

// ⚙️ Config
const RP_ID = process.env.BIOID_RP_ID || "bioid.udochain.com";
const RP_NAME = process.env.BIOID_RP_NAME || "UDoChain BioID";
const JWT_SECRET = process.env.BIOID_JWT_SECRET || "dev_bioid_secret";

// ⚠️ DEMO SIN DB: guardamos "credenciales" en memoria de proceso (efímero)
const memoryCreds = new Map(); // key: userId -> { credentialId, publicKey, counter }

function base64urlToBuffer(b64u) {
  return Buffer.from(b64u, "base64");
}
function bufferToBase64url(buf) {
  return Buffer.from(buf).toString("base64");
}

function signState(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "10m" });
}
function verifyState(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = async (req, res) => {
  try {
    // Vercel enruta por archivo; usamos path en body para distinguir acciones
    // Pero aquí definimos endpoints por método+path como si fuese micro-router:
    const url = new URL(req.url, `https://${req.headers.host}`);
    const pathname = url.pathname;

    if (req.method === "POST" && pathname === "/api/bioid/start-enroll") {
      const { userId = "demo@user" } = await readJson(req);
      const options = generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: userId,
        attestationType: "none",
        authenticatorSelection: {
          userVerification: "preferred",
          authenticatorAttachment: "platform",
          residentKey: "preferred",
        },
      });
      const token = signState({ userId, challenge: options.challenge, type: "enroll" });
      return json(res, { options, token });
    }

    if (req.method === "POST" && pathname === "/api/bioid/finish-enroll") {
      const { authorization } = req.headers;
      if (!authorization) return bad(res, "Missing Authorization");
      const token = authorization.replace(/^Bearer\s+/i, "");
      const state = verifyState(token);

      const { userId = "demo@user", attestation } = await readJson(req);
      if (state.type !== "enroll" || state.userId !== userId) return bad(res, "Invalid state");

      const expectedChallenge = state.challenge;

      const verification = await verifyRegistrationResponse({
        response: decodeAttestation(attestation),
        expectedRPID: RP_ID,
        expectedOrigin: `https://${RP_ID}`,
        expectedChallenge,
      });

      if (!verification.verified) return bad(res, "Attestation not verified");

      const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

      // persistir (demo: memoria)
      memoryCreds.set(userId, {
        credentialId: bufferToBase64url(credentialID),
        publicKey: bufferToBase64url(credentialPublicKey),
        counter: counter || 0,
      });

      // hash que guardarás en Wallet2
      const biometricHash = sha256Hex(bufferToBase64url(credentialID));
      return json(res, {
        ok: true,
        biometricHash,
        credentialId: bufferToBase64url(credentialID),
      });
    }

    if (req.method === "POST" && pathname === "/api/bioid/start-verify") {
      const { userId = "demo@user" } = await readJson(req);
      const cred = memoryCreds.get(userId);
      if (!cred) return bad(res, "No credential for this user. Please enroll first.");

      const options = generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: "preferred",
        allowCredentials: [
          {
            id: Buffer.from(cred.credentialId, "base64"),
            type: "public-key",
          },
        ],
      });

      const token = signState({
        userId,
        challenge: options.challenge,
        type: "verify",
        credentialId: cred.credentialId,
      });

      // Devolvemos id en base64 para el front
      options.allowCredentials = [
        { id: cred.credentialId, type: "public-key" },
      ];

      return json(res, { options, token });
    }

    if (req.method === "POST" && pathname === "/api/bioid/finish-verify") {
      const { authorization } = req.headers;
      if (!authorization) return bad(res, "Missing Authorization");
      const token = authorization.replace(/^Bearer\s+/i, "");
      const state = verifyState(token);

      const { userId = "demo@user", assertion } = await readJson(req);
      if (state.type !== "verify" || state.userId !== userId) return bad(res, "Invalid state");

      const cred = memoryCreds.get(userId);
      if (!cred) return bad(res, "No credential found for user");

      const verification = await verifyAuthenticationResponse({
        response: decodeAssertion(assertion),
        expectedRPID: RP_ID,
        expectedOrigin: `https://${RP_ID}`,
        expectedChallenge: state.challenge,
        authenticator: {
          credentialID: Buffer.from(cred.credentialId, "base64"),
          credentialPublicKey: Buffer.from(cred.publicKey, "base64"),
          counter: cred.counter || 0,
        },
      });

      if (!verification.verified) return bad(res, "Assertion not verified");

      // update counter
      memoryCreds.set(userId, {
        ...cred,
        counter: verification.authenticationInfo.newCounter || cred.counter,
      });

      return json(res, { verified: true });
    }

    return notFound(res);
  } catch (err) {
    console.error(err);
    return error(res, err?.message || "Server error");
  }
};

// ---------- helpers ----------
function readJson(req) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (c) => (buf += c));
    req.on("end", () => {
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}
function json(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}
function bad(res, msg) {
  return json(res, { ok: false, message: msg }, 400);
}
function notFound(res) {
  return json(res, { ok: false, message: "Not found" }, 404);
}
function error(res, msg) {
  return json(res, { ok: false, message: msg }, 500);
}
function sha256Hex(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}
function decodeAttestation(att) {
  return {
    id: att.id,
    rawId: base64urlToBuffer(att.rawId),
    type: att.type,
    response: {
      attestationObject: base64urlToBuffer(att.response.attestationObject),
      clientDataJSON: base64urlToBuffer(att.response.clientDataJSON),
    },
    clientExtensionResults: att.clientExtensionResults || {},
  };
}
function decodeAssertion(ast) {
  return {
    id: ast.id,
    rawId: base64urlToBuffer(ast.rawId),
    type: ast.type,
    response: {
      authenticatorData: base64urlToBuffer(ast.response.authenticatorData),
      clientDataJSON: base64urlToBuffer(ast.response.clientDataJSON),
      signature: base64urlToBuffer(ast.response.signature),
      userHandle: ast.response.userHandle
        ? base64urlToBuffer(ast.response.userHandle)
        : null,
    },
    clientExtensionResults: ast.clientExtensionResults || {},
  };
}
