import "dotenv/config";
import { PrismaClient } from "@prisma/client";

/**
 * Minimal seed stub — expand in Phase 7 with full demo company data.
 * Run after migrate: npm run seed
 */
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.company.count();
  console.info(`Seed stub OK. Companies in DB: ${count}`);
  console.info("Full demo seed lands in Phase 7 (Build Plan §15).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
