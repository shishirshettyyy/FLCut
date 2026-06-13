import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL;

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
    }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}