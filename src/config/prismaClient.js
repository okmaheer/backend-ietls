import { PrismaClient } from '../../prisma-generated-client/index.js';

export const prisma = new PrismaClient();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
