import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

let prismaInstance: PrismaClient | null = null;

export const getDatabase = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
    logger.info("Prisma client oluşturuldu", "Database");
  }
  return prismaInstance;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    logger.info("Prisma bağlantısı kapatıldı", "Database");
  }
};
