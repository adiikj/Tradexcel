const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type CodeEmail = {
  heading: string;
  intro: string;
  code: string;
  codeLabel: string;
  ignoreNote: string; // shown when the reader didn't ask for this email
  email: string;
  reason: string; // "someone used it to sign up for Tradexcel"
};

// Table-based layout + inline styles for consistent rendering across mail clients.
// The code stays one unbroken string (no per-digit cells) so it copies cleanly,
// and the hidden preheader puts it in the inbox preview line.
function codeEmailTemplate(e: CodeEmail): string {
  const email = escapeHtml(e.email);
  // Trailing &zwnj;&nbsp; pairs stop clients pulling body text into the preview.
  const preheader = `Your code is ${e.code}. It expires in 10 minutes.${"&zwnj;&nbsp;".repeat(40)}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>${e.heading}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F0F3F5;font-family:'Poppins',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F3F5;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;">
            <tr>
              <td style="height:4px;line-height:4px;font-size:0;background-color:#2196F3;border-radius:16px 16px 0 0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:28px 32px 20px 32px;text-align:center;">
                <span style="font-size:22px;font-weight:700;color:#1e293b;">Trad<span style="color:#2196F3;">excel</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <h1 style="margin:0;font-size:20px;line-height:28px;font-weight:600;color:#1e293b;text-align:center;">${e.heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 32px 24px 32px;">
                <p style="margin:0;font-size:14px;line-height:22px;color:#64748b;text-align:center;">${e.intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="background-color:#EEF5FF;border:1px dashed #90CAF9;border-radius:12px;padding:18px 12px 20px 12px;">
                      <p style="margin:0 0 8px 0;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;">${e.codeLabel}</p>
                      <p style="margin:0;font-size:36px;line-height:44px;font-weight:700;letter-spacing:8px;color:#1565C0;font-family:'Courier New',Courier,monospace;-webkit-user-select:all;user-select:all;">${e.code}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px 32px;">
                <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;text-align:center;">
                  Expires in <strong style="color:#1e293b;">10 minutes</strong> and works only once.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#FFF8E1;border-radius:10px;padding:12px 16px;">
                      <p style="margin:0;font-size:13px;line-height:20px;color:#795548;">
                        <strong>Keep this code private.</strong> Tradexcel will never ask for it by phone, chat or email. Anyone who has it can get into your account.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <p style="margin:0;font-size:13px;line-height:20px;color:#94a3b8;text-align:center;">${e.ignoreNote}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#F8FAFC;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;">
                <p style="margin:0 0 6px 0;font-size:12px;line-height:18px;color:#94a3b8;text-align:center;">
                  This email was sent to <span style="color:#64748b;">${email}</span> because ${e.reason}.
                </p>
                <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;text-align:center;">
                  Tradexcel - practice trading with real market prices, zero real-money risk.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function otpEmailTemplate(otp: string, email: string): { html: string; text: string } {
  const ignoreNote = "Didn't try to sign up? You can safely ignore this email - no account will be created without this code.";
  const html = codeEmailTemplate({
    heading: "Verify your email",
    intro: "Enter this code on Tradexcel to confirm your email and finish setting up your account.",
    code: otp,
    codeLabel: "Verification code",
    ignoreNote,
    email,
    reason: "someone used it to sign up for Tradexcel",
  });
  const text = [
    `Your Tradexcel verification code is: ${otp}`,
    "",
    "Enter it on Tradexcel to confirm your email and finish setting up your account.",
    "It expires in 10 minutes and works only once.",
    "",
    "Keep this code private. Tradexcel will never ask for it by phone, chat or email.",
    "",
    ignoreNote,
  ].join("\n");

  return { html, text };
}

export function passwordResetEmailTemplate(code: string, email: string): { html: string; text: string } {
  const ignoreNote = "Didn't ask to reset your password? You can safely ignore this email - your password hasn't changed.";
  const html = codeEmailTemplate({
    heading: "Reset your password",
    intro: "Enter this code on Tradexcel to choose a new password or PIN.",
    code,
    codeLabel: "Reset code",
    ignoreNote,
    email,
    reason: "someone asked to reset the password for this Tradexcel account",
  });
  const text = [
    `Your Tradexcel password reset code is: ${code}`,
    "",
    "Enter it on Tradexcel to choose a new password or PIN.",
    "It expires in 10 minutes and works only once.",
    "",
    "Keep this code private. Tradexcel will never ask for it by phone, chat or email.",
    "",
    ignoreNote,
  ].join("\n");

  return { html, text };
}

// Forwards a contact-us form submission - the reply-to is set to the
// submitter's email so replying goes straight back to them.
export function contactFormEmailTemplate(
  name: string,
  email: string,
  message: string
): { html: string; text: string } {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#F0F3F5;font-family:'Poppins',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F3F5;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:32px 32px 20px 32px;text-align:center;">
                <span style="font-size:22px;font-weight:700;color:#1e293b;">Trad<span style="color:#2196F3;">excel</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;text-align:center;">New contact form message</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;">
                  <strong style="color:#1e293b;">From:</strong> ${escape(name)} &lt;${escape(email)}&gt;
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#EEF5FF;border-radius:12px;padding:20px;">
                      <p style="margin:0;font-size:14px;line-height:22px;color:#1e293b;white-space:pre-wrap;">${escape(message)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#F8FAFC;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;">
                <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                  Sent from the Tradexcel contact form. Reply to this email to respond directly to ${escape(name)}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `New contact form message\n\nFrom: ${name} <${email}>\n\n${message}\n\n---\nReply to this email to respond directly to ${name}.`;

  return { html, text };
}

// Support requests from logged-in users - name/email come from the account,
// not user-typed input, so they're trustworthy in a way the public contact
// form's aren't.
export function supportRequestEmailTemplate(
  name: string,
  email: string,
  subject: string,
  message: string
): { html: string; text: string } {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#F0F3F5;font-family:'Poppins',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F3F5;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:32px 32px 20px 32px;text-align:center;">
                <span style="font-size:22px;font-weight:700;color:#1e293b;">Trad<span style="color:#2196F3;">excel</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;text-align:center;">New support request</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;">
                  <strong style="color:#1e293b;">From:</strong> ${escape(name)} &lt;${escape(email)}&gt;<br/>
                  <strong style="color:#1e293b;">Subject:</strong> ${escape(subject)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#EEF5FF;border-radius:12px;padding:20px;">
                      <p style="margin:0;font-size:14px;line-height:22px;color:#1e293b;white-space:pre-wrap;">${escape(message)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#F8FAFC;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;">
                <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                  Sent from the Tradexcel dashboard support form. Reply to this email to respond directly to ${escape(name)}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `New support request\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\n${message}\n\n---\nReply to this email to respond directly to ${name}.`;

  return { html, text };
}

export type WeeklyRecap = {
  name: string;
  pnlPercent: number;
  endNetWorth: number;
  rank: number;
  players: number;
  trades: number;
  badges: string[]; // "🎉 First Trade"
  siteUrl: string;
};

// Monday's "your week" email (services/weeklyRecap.ts).
export function weeklyRecapEmailTemplate(r: WeeklyRecap): { subject: string; html: string; text: string } {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(r.endNetWorth);
  const pct = `${r.pnlPercent >= 0 ? "+" : ""}${r.pnlPercent.toFixed(2)}%`;
  const color = r.pnlPercent > 0 ? "#16a34a" : r.pnlPercent < 0 ? "#dc2626" : "#1e293b";
  const subject = `Your week on Tradexcel: ${pct}, #${r.rank} of ${r.players}`;
  const badgeLine = r.badges.length ? `Badges earned: ${r.badges.join(", ")}` : "";
  const row = (label: string, value: string, valueColor = "#1e293b") =>
    `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">${label}</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:${valueColor};text-align:right;">${value}</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#F0F3F5;font-family:'Poppins',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F3F5;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:32px 32px 12px 32px;text-align:center;">
                <span style="font-size:22px;font-weight:700;color:#1e293b;">Trad<span style="color:#2196F3;">excel</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 4px 32px;text-align:center;">
                <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;">Hi ${escape(r.name)}, here's your week</p>
                <p style="margin:12px 0 0 0;font-size:36px;font-weight:700;color:${color};">${pct}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${row("Final net worth", inr)}
                  ${row("Rank", `#${r.rank} of ${r.players}`)}
                  ${row("Trades", String(r.trades))}
                </table>
                ${badgeLine ? `<p style="margin:12px 0 0 0;font-size:14px;color:#1e293b;">${escape(badgeLine)}</p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px 32px;text-align:center;">
                <p style="margin:0 0 16px 0;font-size:14px;color:#64748b;">Your wallet has reset to ₹1,00,000 for the new season.</p>
                <a href="${r.siteUrl}/dashboard" style="display:inline-block;background-color:#2196F3;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 24px;border-radius:10px;">Start this week</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#F8FAFC;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;">
                <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                  You get this every Monday. <a href="${r.siteUrl}/your-profile" style="color:#94a3b8;">Turn it off in your profile settings</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Hi ${r.name}, here's your week on Tradexcel: ${pct}`,
    "",
    `Final net worth: ${inr}`,
    `Rank: #${r.rank} of ${r.players}`,
    `Trades: ${r.trades}`,
    ...(badgeLine ? [badgeLine] : []),
    "",
    "Your wallet has reset to ₹1,00,000 for the new season.",
    `${r.siteUrl}/dashboard`,
    "",
    `You get this every Monday. Turn it off in your profile settings: ${r.siteUrl}/your-profile`,
  ].join("\n");

  return { subject, html, text };
}
