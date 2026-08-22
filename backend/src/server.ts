/**
 * OWNER: Prasanna (Person A) — keeps server bootable on main.
 * Vignesh wires real Socket.io via common/socket (copy from reference).
 */
import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./common/config/env.js";
import { prisma } from "./common/db/prisma.js";
import { initSocket } from "./common/socket/index.js";

const app = createApp();
const server = http.createServer(app);

async function main() {
  await prisma.$connect();
  initSocket(server);
  server.listen(env.PORT, () => {
    console.info(`Dayflow API listening on http://localhost:${env.PORT}`);
    console.info(`Health: http://localhost:${env.PORT}/health`);
  });
}

main().catch(async (err) => {
  console.error("Failed to start server", err);
  await prisma.$disconnect();
  process.exit(1);
});
