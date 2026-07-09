// Table-based layout + inline styles for consistent rendering across mail clients.
export function otpEmailTemplate(otp: string): { html: string; text: string } {
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
                <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;text-align:center;">Verify your email</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px 32px;">
                <p style="margin:0;font-size:14px;line-height:22px;color:#64748b;text-align:center;">
                  Enter this code to finish signing in to your Tradexcel account.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="background-color:#EEF5FF;border-radius:12px;padding:20px;">
                      <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#2196F3;font-family:'Courier New',monospace;">${otp}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <p style="margin:0;font-size:13px;line-height:20px;color:#94a3b8;text-align:center;">
                  This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#F8FAFC;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;">
                <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
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

  const text = `Your Tradexcel verification code is ${otp}.\n\nThis code expires in 10 minutes. If you didn't request this, you can safely ignore this email.`;

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
