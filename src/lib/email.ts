import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "[Email] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.",
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
  });
};

let transporter: nodemailer.Transporter | null = null;

function getOrCreateTransporter() {
  if (!transporter) {
    transporter = getTransporter();
  }
  return transporter;
}

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const t = getOrCreateTransporter();
  if (!t) {
    console.warn("[Email] Skipping email send — SMTP not configured.");
    return false;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await t.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

export { getOrCreateTransporter };
