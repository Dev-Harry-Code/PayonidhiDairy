import path from "node:path";
import { mkdir } from "node:fs/promises";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let server: MongoMemoryServer | null = null;

export async function startTestDatabase(): Promise<void> {
  const binaryDirectory = path.resolve(".cache", "mongodb-binaries");
  await mkdir(binaryDirectory, { recursive: true });
  process.env.MONGOMS_DOWNLOAD_DIR = binaryDirectory;
  process.env.MONGOMS_VERSION = "7.0.14";
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri());
}

export async function clearTestDatabase(): Promise<void> {
  const collections = await mongoose.connection.db?.collections();
  if (collections) await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function stopTestDatabase(): Promise<void> {
  await mongoose.disconnect();
  await server?.stop();
  server = null;
}
