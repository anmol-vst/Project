import mongoose from "mongoose";
import bcrypt from "bcrypt";
import process from "node:process";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { User, UserRole, SubscriptionPlan, SubscriptionStatus } from "db/models";

// Load .env from candidate paths (same logic as index.ts)
const currentFile = fileURLToPath(import.meta.url);
const backendDir = resolve(dirname(currentFile), "..");

const envCandidates = [
  resolve(backendDir, ".env"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "apps/backend/.env"),
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is not set. Create apps/backend/.env with MONGO_URI.");
  process.exit(1);
}

const ADMIN_EMAIL = "admin@golfcharity.com";
const ADMIN_PASSWORD = "Admin@1234";
const ADMIN_NAME = "Platform Admin";

async function seed(): Promise<void> {
  await mongoose.connect(MONGO_URI as string);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash,
    role: UserRole.Admin,
    subscription: {
      plan: SubscriptionPlan.Monthly,
      status: SubscriptionStatus.Active,
    },
  });

  console.log("Admin user created successfully!");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  ID:       ${String(admin._id)}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
