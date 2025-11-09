import mongoose from "mongoose";

const BioCredentialSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  email: { type: String, index: true },
  credentialId: { type: String, unique: true, index: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, default: 0 },
  transports: { type: [String], default: [] },
  wallet2Hash: { type: String }, // hash derivado (ej. sha256(credentialId))
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date }
});

export default mongoose.model("BioCredential", BioCredentialSchema);
