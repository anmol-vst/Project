import express, { type Express } from "express";
import mongoose from "mongoose";
import process from "node:process";
import { resolve, dirname } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import scoreRoutes from "./routes/score.routes.js";
import charityRoutes from "./routes/charity.routes.js";
import drawRoutes from "./routes/draw.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import winnerRoutes from "./routes/winner.routes.js";
import cors from "cors";

const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(cors());

// Load .env from common backend locations before reading process.env.
dotenv.config({ path: resolve(process.cwd(), ".env"), override: false });
dotenv.config({ path: resolve(process.cwd(), "apps/backend/.env"), override: false });

const decodeEnvBuffer = (buffer: Buffer): string => {
  if (buffer.length >= 2) {
    const b0 = buffer[0];
    const b1 = buffer[1];
    if (b0 === 0xff && b1 === 0xfe) return buffer.toString("utf16le");
    if (b0 === 0xfe && b1 === 0xff) {
      const swapped = Buffer.from(buffer);
      for (let i = 0; i + 1 < swapped.length; i += 2) {
        const first = swapped[i] as number;
        swapped[i] = swapped[i + 1] as number;
        swapped[i + 1] = first;
      }
      return swapped.toString("utf16le");
    }
  }

  const utf8 = buffer.toString("utf8");
  if (utf8.includes("\u0000")) return buffer.toString("utf16le");
  return utf8;
};

const extractMongoUri = (raw: string): string | undefined => {
  const sanitized = raw.replace(/\u0000/g, "").replace(/\ufeff/g, "");
  const keyed = sanitized.match(/^\s*(MONGO_URI|MONGODB_URI)\s*=\s*(.+)\s*$/im);
  if (keyed?.[2]) {
    const value = keyed[2].trim().replace(/^['"]|['"]$/g, "");
    if (value) return value;
  }

  const byPattern = sanitized.match(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/i);
  return byPattern?.[0];
};

const readEnvFromCandidates = (): Record<string, string> => {
  const currentFile = fileURLToPath(import.meta.url);
  const backendDir = resolve(dirname(currentFile), "..");
  const candidates = [
    resolve(backendDir, ".env"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "apps/backend/.env"),
  ];
  (globalThis as any).__backendEnvCandidates = candidates;

  const envMap: Record<string, string> = {};
  for (const envPath of candidates) {
    try {
      if (!existsSync(envPath)) continue;
      const rawBuffer = readFileSync(envPath);
      const raw = decodeEnvBuffer(rawBuffer);
      const parsedMongo = extractMongoUri(raw);
      if (parsedMongo && !envMap.MONGO_URI) {
        envMap.MONGO_URI = parsedMongo;
        if (!process.env.MONGO_URI) process.env.MONGO_URI = parsedMongo;
      }
      const lines = raw.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex <= 0) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        envMap[key] = value;
        if (!process.env[key]) process.env[key] = value;
      }
    } catch {
      // Try next path candidate.
    }
  }
  return envMap;
};

const envFromFile = readEnvFromCandidates();
const mongoFromEnvMap =
  envFromFile.MONGO_URI ||
  envFromFile.MONGODB_URI ||
  Object.entries(envFromFile).find(([key]) => key.toLowerCase().includes("mongo"))?.[1] ||
  Object.values(envFromFile).find((value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"));

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  mongoFromEnvMap;

app.use((req, res, next) => {
  if (req.originalUrl === "/api/subscriptions/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/charities", charityRoutes);
app.use("/api/draws", drawRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/winners", winnerRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", pid: process.pid });
});

const start = async (): Promise<void> => {
  try {
    if (!MONGO_URI) {
      const candidates = ((globalThis as any).__backendEnvCandidates || []) as string[];
      const existence = candidates
        .map((p) => `${p} => ${existsSync(p) ? "found" : "missing"}`)
        .join(" | ");
      throw new Error(
        `MONGO_URI is missing. Save apps/backend/.env as UTF-8 and set MONGO_URI. cwd=${process.cwd()} paths=${existence}`
      );
    }
    await mongoose.connect(MONGO_URI);
    console.log(`[Worker ${process.pid}] Connected to MongoDB`);
    app.listen(PORT, () => {
      console.log(`[Worker ${process.pid}] Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error(`[Worker ${process.pid}] Failed to start:`, err);
    process.exit(1);
  }
};
start();

export default app;