import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "DailyDose <no-reply@dailydose.com>";

/**
 * Send a password-reset email containing the given link. If RESEND_API_KEY is
 * not configured we fall back to logging the link server-side, so the flow is
 * fully exercisable in development without an email account.
 */
export async function sendResetEmail(to: string, link: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[reset] (no RESEND_API_KEY) reset link for ${to}: ${link}`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your DailyDose password",
    text:
      `Someone requested a password reset for your DailyDose account.\n\n` +
      `Reset it here (valid for 1 hour):\n${link}\n\n` +
      `If this wasn't you, you can safely ignore this email.`,
    html:
      `<p>Someone requested a password reset for your DailyDose account.</p>` +
      `<p><a href="${link}">Reset your password</a> (valid for 1 hour).</p>` +
      `<p>If this wasn't you, you can safely ignore this email.</p>`,
  });
}
