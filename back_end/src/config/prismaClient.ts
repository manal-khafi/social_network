import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

// Single shared PrismaClient for the whole process. A new client per import
// opens its own connection pool, which exhausts Postgres connections under load
// and during ts-node hot-reloads, so every module must reuse this instance.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
