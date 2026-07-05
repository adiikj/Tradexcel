import nodemailer from "nodemailer";
import { google } from "googleapis";

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// The Gmail OAuth2 access token is fetched lazily, per send, instead of once
// at module load — a stale/expired refresh token must not crash the whole
// server at startup (it used to, before this was extracted).
export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<void> {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const { token } = await oAuth2Client.getAccessToken();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GOOGLE_GMAIL_ID,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: token as string,
    },
  } as any);

  await transporter.sendMail({ from: process.env.GOOGLE_GMAIL_ID, to, subject, html, text });
}
