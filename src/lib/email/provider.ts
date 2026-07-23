import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging/logger";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  locale: "de" | "en";
};
export interface EmailProvider {
  send(message: EmailMessage): Promise<{ messageId: string }>;
}
export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage) {
    logger.info("email_preview", {
      locale: message.locale,
    });
    return { messageId: `console-${crypto.randomUUID()}` };
  }
}

/** `"Khan Dry Fruit" <orders@example.com>`, or the bare address if unnamed. */
function fromHeader() {
  const address = env.SMTP_FROM_EMAIL;
  return env.SMTP_FROM_NAME ? `"${env.SMTP_FROM_NAME}" <${address}>` : address;
}

/**
 * Works with any SMTP relay — Gmail/Google Workspace, Brevo, Postmark, Mailgun.
 * Port 465 is implicit TLS; anything else (587, 25) starts plaintext and
 * upgrades via STARTTLS, which we require rather than allow.
 */
export class SmtpEmailProvider implements EmailProvider {
  private transporter: Transporter | null = null;

  private getTransporter() {
    if (this.transporter) return this.transporter;
    if (!env.SMTP_HOST || !env.SMTP_FROM_EMAIL)
      throw new Error("SMTP_NOT_CONFIGURED");
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      requireTLS: env.SMTP_PORT !== 465,
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
          : undefined,
      pool: true,
      maxConnections: 3,
    });
    return this.transporter;
  }

  async send(message: EmailMessage) {
    const transporter = this.getTransporter();
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const result = await transporter.sendMail({
          from: fromHeader(),
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          replyTo: env.SMTP_REPLY_TO || undefined,
        });
        const messageId = result.messageId ?? crypto.randomUUID();
        logger.info("email_delivery_succeeded", {
          messageId,
          locale: message.locale,
          attempt,
        });
        return { messageId };
      } catch (error) {
        lastError = error;
        logger.warn("email_delivery_attempt_failed", {
          errorCode: error instanceof Error ? error.name : "UNKNOWN_ERROR",
          attempt,
        });
        if (attempt < 3)
          await new Promise((resolve) => setTimeout(resolve, attempt * 150));
      }
    }
    logger.error("email_delivery_failed", { errorCode: "SMTP_SEND_FAILED" });
    throw lastError;
  }
}

export function getEmailProvider(): EmailProvider {
  return env.SMTP_HOST && env.SMTP_FROM_EMAIL
    ? new SmtpEmailProvider()
    : new ConsoleEmailProvider();
}
