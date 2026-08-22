import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const rows = await p.user.findMany({
  where: {
    OR: [
      { email: { contains: "prasannabhat756", mode: "insensitive" } },
      { employee: { id: "a7fd64f0-52b4-4f0b-9681-b9a45211715e" } },
    ],
  },
  select: {
    id: true,
    email: true,
    loginId: true,
    role: true,
    mustChangePassword: true,
    employee: { select: { id: true, firstName: true, lastName: true } },
  },
});
console.log(JSON.stringify(rows, null, 2));
await p.$disconnect();
