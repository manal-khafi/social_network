// back_end/src/config/PrismaBlock.ts
import type { PrismaClient } from "@prisma/client";
import prisma from "./prismaClient";

// Kept for backwards compatibility. The actual client is the shared singleton
// defined in ./prismaClient so the whole process uses one connection pool.
class PrismaService {
  public static getInstance(): PrismaClient {
    return prisma;
  }

  public static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export { prisma };
export default PrismaService;
