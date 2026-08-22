/**
 * SMTP mailer — sends real mail when SMTP_HOST is set; otherwise logs (dev stub).
 */
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env.js";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST?.trim());
}

function getTransporter(): Transporter | null {
  if (!isSmtpConfigured()) return null;
  if (transporter) return transporter;

  const port = env.SMTP_PORT;
  const user = env.SMTP_USER?.trim() ?? "";
  const pass = (env.SMTP_PASS ?? "").replace(/\s/g, "");
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
  return transporter;
}

/** Fire-and-forget safe send. Never throws to callers; logs failures. */
export async function sendMail(input: SendMailInput): Promise<{ sent: boolean; mode: "smtp" | "log" }> {
  const from = env.EMAIL_FROM || "Dayflow <noreply@dayflow.local>";

  if (!isSmtpConfigured()) {
    console.info(
      `[email:log] to=${input.to} subject=${JSON.stringify(input.subject)}\n${input.text}`,
    );
    return { sent: false, mode: "log" };
  }

  try {
    const tx = getTransporter();
    if (!tx) return { sent: false, mode: "log" };
    await tx.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<pre style="font-family:system-ui,sans-serif">${escapeHtml(input.text)}</pre>`,
    });
    console.info(`[email:sent] to=${input.to} subject=${JSON.stringify(input.subject)}`);
    return { sent: true, mode: "smtp" };
  } catch (err) {
    console.error(`[email:error] to=${input.to}`, err);
    return { sent: false, mode: "smtp" };
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f6fc;font-family:system-ui,Segoe UI,sans-serif;color:#1a1d2e">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;padding:28px;border:1px solid #e2e6f0">
        <tr><td>
          <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#5b6cff">Dayflow</p>
          <h1 style="margin:0 0 16px;font-size:18px">${title}</h1>
          ${bodyHtml}
          <p style="margin:24px 0 0;font-size:12px;color:#6b7289">Every workday, perfectly aligned.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export const mailTemplates = {
  verifyEmail(opts: { to: string; name?: string | null; token: string }) {
    const url = `${env.APP_URL}/verify-email?token=${encodeURIComponent(opts.token)}`;
    const greet = opts.name ? `Hi ${opts.name},` : "Hi,";
    const text = `${greet}\n\nPlease verify your Dayflow email:\n${url}\n\nThis link expires in 48 hours.`;
    return {
      to: opts.to,
      subject: "Verify your Dayflow email",
      text,
      html: layout(
        "Verify your email",
        `<p>${escapeHtml(greet)}</p>
         <p>Confirm your email to finish setting up Dayflow.</p>
         <p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#5b6cff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">Verify email</a></p>
         <p style="font-size:12px;color:#6b7289;word-break:break-all">${escapeHtml(url)}</p>`,
      ),
    } satisfies SendMailInput;
  },

  passwordReset(opts: { to: string; token: string }) {
    const url = `${env.APP_URL}/reset-password?token=${encodeURIComponent(opts.token)}`;
    const text = `Reset your Dayflow password:\n${url}\n\nThis link expires in 2 hours. If you did not request this, ignore this email.`;
    return {
      to: opts.to,
      subject: "Reset your Dayflow password",
      text,
      html: layout(
        "Reset your password",
        `<p>We received a request to reset your password.</p>
         <p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#5b6cff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">Reset password</a></p>
         <p style="font-size:12px;color:#6b7289;word-break:break-all">${escapeHtml(url)}</p>`,
      ),
    } satisfies SendMailInput;
  },

  employeeWelcome(opts: {
    to: string;
    firstName?: string | null;
    companyName: string;
    loginId: string;
    tempPassword: string;
    verifyToken: string;
  }) {
    const verifyUrl = `${env.APP_URL}/verify-email?token=${encodeURIComponent(opts.verifyToken)}`;
    const loginUrl = `${env.APP_URL}/login`;
    const greet = opts.firstName ? `Hi ${opts.firstName},` : "Hi,";
    const text = `${greet}

You've been added to ${opts.companyName} on Dayflow.

Login ID: ${opts.loginId}
Temporary password: ${opts.tempPassword}
Sign in: ${loginUrl}

Verify email: ${verifyUrl}

You will be asked to change your password on first login.`;
    return {
      to: opts.to,
      subject: `Welcome to ${opts.companyName} on Dayflow`,
      text,
      html: layout(
        `Welcome to ${escapeHtml(opts.companyName)}`,
        `<p>${escapeHtml(greet)}</p>
         <p>Your Dayflow account is ready.</p>
         <ul>
           <li><strong>Login ID:</strong> ${escapeHtml(opts.loginId)}</li>
           <li><strong>Temporary password:</strong> ${escapeHtml(opts.tempPassword)}</li>
         </ul>
         <p style="margin:20px 0"><a href="${loginUrl}" style="display:inline-block;background:#5b6cff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">Sign in</a></p>
         <p><a href="${verifyUrl}">Verify your email</a></p>
         <p style="font-size:13px;color:#6b7289">Change your password on first login.</p>`,
      ),
    } satisfies SendMailInput;
  },

  notificationAlert(opts: { to: string; title: string; message: string }) {
    const text = `${opts.title}\n\n${opts.message}\n\nOpen Dayflow: ${env.APP_URL}`;
    return {
      to: opts.to,
      subject: `Dayflow: ${opts.title}`,
      text,
      html: layout(
        escapeHtml(opts.title),
        `<p>${escapeHtml(opts.message)}</p>
         <p style="margin:24px 0"><a href="${env.APP_URL}" style="display:inline-block;background:#5b6cff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">Open Dayflow</a></p>`,
      ),
    } satisfies SendMailInput;
  },
};
