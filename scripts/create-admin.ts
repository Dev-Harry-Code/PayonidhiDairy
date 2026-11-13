import { existsSync } from "node:fs";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db-core";
import { normalisePhone } from "@/lib/phone";
import { UserModel } from "@/models";

async function main() {
  loadLocalEnv();

  const args = parseArgs(process.argv.slice(2));
  const name = args.name?.trim();
  const phone = args.phone ? normalisePhone(args.phone) : null;
  const pin = args.pin;

  if (!name || name.length < 2 || name.length > 60) fail("--name must be 2–60 characters");
  if (!phone) fail("--phone must be a valid Indian mobile number");
  if (!pin || !/^\d{6,8}$/.test(pin)) fail("--pin must be 6–8 digits");

  await connectDB();
  if (await UserModel.exists({ phone })) fail("An account with this phone already exists");

  await UserModel.create({
    name,
    phone,
    pinHash: await bcrypt.hash(pin, 10),
    role: "admin",
    preferredLanguage: "en",
  });

  process.stdout.write(`Admin created for ${name}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});

function parseArgs(values: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    const value = values[index + 1];
    if (key?.startsWith("--") && value && !value.startsWith("--")) {
      result[key.slice(2)] = value;
      index += 1;
    }
  }
  return result;
}

function loadLocalEnv() {
  if (existsSync(".env.local") && "loadEnvFile" in process) {
    process.loadEnvFile(".env.local");
  }
}

function fail(message: string): never {
  process.stderr.write(`Cannot create admin: ${message}\n`);
  process.exit(1);
}
