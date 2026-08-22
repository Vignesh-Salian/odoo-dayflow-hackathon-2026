import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const emps = await prisma.employee.findMany({
    include: { user: { select: { company: { select: { code: true } } } } },
  });
  let n = 0;
  for (const e of emps) {
    if (e.user.company.code !== "OI") continue;
    const url = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
      `${e.firstName}-${e.lastName}`,
    )}`;
    await prisma.employee.update({ where: { id: e.id }, data: { avatarUrl: url } });
    n += 1;
  }
  console.log(`Updated avatars for ${n} employees`);
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
