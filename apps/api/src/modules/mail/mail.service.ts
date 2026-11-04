// SERVICE: Sends password-reset emails via SMTP, or logs them if SMTP is not configured.
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SendPassphraseEmailOptions {
  toEmail: string;
  userName: string;
  passphrase: string;
  expiresAt: Date;
  frontendUrl?: string;
}

export interface SendGenericEmailOptions {
  toEmail: string;
  userName: string;
  subject: string;
  title: string;
  message: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor() {
    this.fromAddress =
      process.env.SMTP_FROM || 'Capital Fleet Security <no-reply@capitalre.com>';
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      this.logger.log(`Initializing SMTP transport for ${host}:${port}`);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    } else {
      // Development fallback: stream transport that logs email content
      this.logger.warn(
        'No SMTP credentials configured in environment (SMTP_HOST, SMTP_USER, SMTP_PASS). Using simulated development transport.',
      );
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }
  }

  /**
   * Send the secure password reset passphrase to user's email inbox
   */
  async sendPasswordResetPassphrase(
    options: SendPassphraseEmailOptions,
  ): Promise<EmailDeliveryResult> {
    const { toEmail, userName, passphrase, expiresAt, frontendUrl } = options;
    const appUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${appUrl}?action=reset-password&email=${encodeURIComponent(toEmail)}`;

    const formattedExpiry = expiresAt.toLocaleString('en-US', {
      timeZone: 'Africa/Addis_Ababa',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const subject = '🔒 Capital Fleet — Your Password Reset Passphrase';
    const textContent = `
Hello ${userName},

A password reset request for your Capital Fleet account (${toEmail}) was approved by a System Administrator.

YOUR SECURE RESET PASSPHRASE:
${passphrase}

This single-use passphrase will expire on: ${formattedExpiry} (East Africa Time).

INSTRUCTIONS TO REGENERATE YOUR PASSWORD:
1. Open Capital Fleet: ${resetUrl}
2. Click "Forgot Password" on the sign-in screen and select "Enter Passphrase".
3. Enter your email or employee ID, your passphrase (${passphrase}), and your new password.
4. Submit the form to immediately regain access.

SECURITY NOTICE:
If you did not request this password reset, please contact the Capital Fleet Security Administrator immediately. Do not share this passphrase with anyone.

Capital Fleet Management System — Capital Real Estate
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset Passphrase</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px 28px; background: #ffffff; }
    .greeting { font-size: 15px; color: #334155; line-height: 1.5; margin-bottom: 20px; }
    .passphrase-box { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .passphrase-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #15803d; font-weight: 700; margin-bottom: 6px; }
    .passphrase-code { font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: 800; color: #166534; letter-spacing: 2px; }
    .expiry-badge { display: inline-block; margin-top: 10px; font-size: 12px; color: #b45309; background: #fef3c7; padding: 4px 10px; border-radius: 6px; font-weight: 600; }
    .steps { background: #f8fafc; border-radius: 10px; padding: 18px; margin: 20px 0; border: 1px solid #e2e8f0; font-size: 13px; color: #475569; }
    .steps ol { margin: 0; padding-left: 20px; }
    .steps li { margin-bottom: 8px; line-height: 1.4; }
    .btn-container { text-align: center; margin: 28px 0 16px 0; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3); }
    .security-note { font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Capital Fleet Management</h1>
      <p>Secure Account Credential Recovery</p>
    </div>
    <div class="content">
      <div class="greeting">
        <strong>Hello ${userName},</strong><br>
        Your request to reset your password for <strong>${toEmail}</strong> has been approved by a System Administrator.
      </div>

      <div class="passphrase-box">
        <div class="passphrase-label">Your Single-Use Reset Passphrase</div>
        <div class="passphrase-code">${passphrase}</div>
        <div class="expiry-badge">⏱ Expires: ${formattedExpiry}</div>
      </div>

      <div class="steps">
        <strong>Next Steps:</strong>
        <ol>
          <li>Open the Capital Fleet login recovery portal.</li>
          <li>Enter your registered email address or Employee ID.</li>
          <li>Enter the passphrase shown above.</li>
          <li>Establish a strong new password meeting enterprise security standards.</li>
        </ol>
      </div>

      <div class="btn-container">
        <a href="${resetUrl}" class="btn">Proceed to Password Reset</a>
      </div>

      <div class="security-note">
        <strong>Security Notice:</strong> This passphrase is valid for a single use only and cannot be reused. If you did not request this password reset, please contact your Capital Fleet Administrator immediately.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Capital Real Estate — Capital Fleet Logistics System. All rights reserved.
    </div>
  </div>
</body>
</html>
    `.trim();

    try {
      if (!this.transporter) {
        throw new Error('Email transporter is not available');
      }

      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      this.logger.log(`Password reset passphrase email dispatched to ${toEmail} [ID: ${info.messageId}]`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      this.logger.error(`Failed to dispatch reset email to ${toEmail}: ${err.message}`, err.stack);
      return {
        success: false,
        error: err.message || 'SMTP delivery failure',
      };
    }
  }

  /**
   * Send notification when password reset was rejected
   */
  async sendPasswordResetRejected(
    toEmail: string,
    userName: string,
    reason: string,
  ): Promise<EmailDeliveryResult> {
    const subject = '⚠️ Capital Fleet — Password Reset Request Update';
    const textContent = `
Hello ${userName},

Your password reset request for your Capital Fleet account (${toEmail}) was reviewed and declined by the System Administrator.

REASON:
${reason}

If you believe this is in error, please contact your department manager or IT Support.

Capital Fleet Management — Capital Real Estate
    `.trim();

    try {
      if (!this.transporter) {
        throw new Error('Email transporter is not available');
      }

      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: toEmail,
        subject,
        text: textContent,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      this.logger.error(`Failed to dispatch rejection email to ${toEmail}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send confirmation after password was successfully changed
   */
  async sendPasswordResetSuccess(toEmail: string, userName: string): Promise<EmailDeliveryResult> {
    const subject = '✅ Capital Fleet — Password Successfully Updated';
    const textContent = `
Hello ${userName},

Your password for your Capital Fleet account (${toEmail}) was successfully updated.

You can now log in using your new credentials.

If you did not perform this action, please alert your System Administrator immediately.

Capital Fleet Management — Capital Real Estate
    `.trim();

    try {
      if (!this.transporter) {
        throw new Error('Email transporter is not available');
      }

      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: toEmail,
        subject,
        text: textContent,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      this.logger.error(`Failed to dispatch success email to ${toEmail}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
