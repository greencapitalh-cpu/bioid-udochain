// Servidor Express principal del módulo BioID
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bioidRoutes from "./routes/bioid.js";

const app = express();

// CORS seguro (origins separados por coma)
const allowed = (process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error("CORS not allowed"));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

// DB
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI");
  process.exit(1);
}
await mongoose.connect(MONGO_URI);
console.log("✅ Mongo connected");

// Rutas
app.use("/api/bioid", bioidRoutes);

// Health
app.get("/api/status", (req, res) => {
  res.json({ ok: true, service: "BioID", ts: new Date().toISOString() });
});

// Boot
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`🚀 BioID API on :${PORT}`));
