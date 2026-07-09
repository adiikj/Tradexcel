import { Resend } from "resend";

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

// Lazily constructed so a missing RESEND_API_KEY doesn't crash the server at
// startup - it only errors when an email is actually sent.
let resend: Resend | null = null;
function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailArgs): Promise<void> {
  const { error } = await getResendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    throw new Error(error.message);
  }
}
