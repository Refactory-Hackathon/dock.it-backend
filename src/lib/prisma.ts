import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { envConfig } from "../config/env.config";

const adapter = new PrismaPg({
  connectionString: envConfig.DATABASE_URL,
});

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

export default prisma;