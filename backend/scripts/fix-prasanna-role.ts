import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";

const p = new PrismaClient();
const email = "prasannabhat756@gmail.com";

const updated = await p.user.update({
  where: { email },
  data: { role: Role.EMPLOYEE },
  select: {
    email: true,
    loginId: true,
    role: true,
    employee: { select: { firstName: true, lastName: true } },
  },
});

console.log("Updated:", JSON.stringify(updated, null, 2));
await p.$disconnect();
