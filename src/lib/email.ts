import sgMail from '@sendgrid/mail';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Alkhaij Tamweel';

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
  const subject = `Reset your password - ${appName}`;
  const html = `
    <p>You requested a password reset.</p>
    <p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#0066b3;color:#fff;text-decoration:none;border-radius:8px;">Reset password</a></p>
    <p>Or copy this link: ${resetLink}</p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, ignore this email.</p>
  `;

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.log('[Email] SENDGRID_API_KEY not set. Reset link:', resetLink);
    return true;
  }

  sgMail.setApiKey(apiKey);
  const from = process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_FROM || 'noreply@example.com';

  try {
    await sgMail.send({
      to,
      from: { email: from, name: appName },
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[Email] SendGrid failed:', err);
    return false;
  }
}
