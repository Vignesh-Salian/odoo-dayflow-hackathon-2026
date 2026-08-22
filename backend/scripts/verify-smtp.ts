import "dotenv/config";
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

console.log("Config check:");
console.log("  HOST:", host || "(empty)");
console.log("  PORT:", port);
console.log("  USER:", user || "(empty)");
console.log("  PASS:", pass ? `set (${pass.replace(/\s/g, "").length} chars)` : "(empty)");
console.log("  FROM:", process.env.EMAIL_FROM);
console.log("  APP_URL:", process.env.APP_URL);

if (!host || !user || !pass) {
  console.error("FAIL: SMTP_HOST / SMTP_USER / SMTP_PASS required");
  process.exit(1);
}

const tx = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass: pass.replace(/\s/g, "") },
});

try {
  await tx.verify();
  console.log("OK: SMTP connection verified with provider");
} catch (e) {
  console.error("FAIL: SMTP verify failed");
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
