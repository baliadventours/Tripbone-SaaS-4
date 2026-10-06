import { resolveEmailConfig } from './email/recipientResolver.js';
import { sendEmailViaProvider } from './email/transporter.js';

export interface EmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlPart: string;
  textPart?: string;
}

/**
 * Core function to send an email via the Global Provider Settings
 */
export const sendEmail = async (options: EmailOptions) => {
  const config = await resolveEmailConfig('global');
  
  const payload = {
    to: [options.toEmail],
    subject: options.subject,
    html: options.htmlPart
  };

  try {
    const result = await sendEmailViaProvider(config, payload);
    console.log(`[SaaS Email] Successfully sent to ${options.toEmail} via ${config.emailProvider}`);
    return result;
  } catch (err: any) {
    console.error(`[SaaS Email] Error during sending:`, err.message);
    throw new Error(err.message || 'Failed to send email');
  }
};

/**
 * Pre-configured Templates
 */

export const sendWelcomeEmail = async (email: string, name: string) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">Trip<span style="color: #00b272;">bone</span></span>
      </div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.3px;">Welcome to Tripbone!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 16px;">Hi ${name},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">We're excited to have you on board. Your operator account has been created, and your <strong>7-Day Free Trial</strong> is active with full Starter features and zero platform commissions.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <p style="font-size: 12px; font-weight: 700; color: #00b272; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.5px;">Your Free Trial Includes:</p>
        <ul style="font-size: 13px; color: #334155; margin: 0; padding-left: 20px; line-height: 1.6;">
          <li>AI-powered tour website & booking engine</li>
          <li>0% platform commissions (BYOPG enabled)</li>
          <li>WhatsApp automations & instant guest dispatch</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://app.tripbone.com" style="background-color: #00b272; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(0,178,114,0.25);">Go to My Dashboard</a>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Tripbone SaaS · Travel Automation & Booking Engine<br />If you didn't create this account, please disregard this email.</p>
    </div>
  `;
  return sendEmail({
    toEmail: email,
    toName: name,
    subject: 'Welcome to Tripbone — 7-Day Free Trial Activated',
    htmlPart: html,
  });
};

export const sendVerificationEmail = async (email: string, link: string) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">Trip<span style="color: #00b272;">bone</span></span>
      </div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.3px;">Confirm Your Email Address</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 16px;">Hello,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">Thank you for creating an operator account on Tripbone. Please click the button below to verify your email address and launch your 7-day free trial workspace:</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${link}" style="background-color: #00b272; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(0,178,114,0.3);">Confirm Email & Launch Workspace</a>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin: 20px 0;">
        <p style="font-size: 11px; color: #64748b; margin: 0; word-break: break-all;">
          <strong>Direct link:</strong> <a href="${link}" style="color: #00b272; text-decoration: underline;">${link}</a>
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Tripbone SaaS · Travel Automation & Booking Engine<br />If you didn't sign up for Tripbone, please ignore this message.</p>
    </div>
  `;
  return sendEmail({
    toEmail: email,
    subject: 'Confirm your Tripbone Registration',
    htmlPart: html,
  });
};

export const sendPaymentSuccessEmail = async (email: string, plan: string, amount: string, invoiceId: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #005ea6;">Payment Successful</h2>
      <p>Hello,</p>
      <p>Your payment for the <strong>${plan}</strong> plan has been processed successfully.</p>
      <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0; color: #666;">Invoice ID</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold;">${invoiceId}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0; color: #666;">Amount Paid</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold;">${amount}</td>
        </tr>
      </table>
      <p>You can download your full PDF invoice from the Billing section of your dashboard.</p>
    </div>
  `;
  return sendEmail({
    toEmail: email,
    subject: `Payment Receipt - Tripbone Invoice #${invoiceId}`,
    htmlPart: html,
  });
};

export const sendPaymentDueEmail = async (email: string, plan: string, amount: string, dueDate: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #ea580c;">Payment Due Reminder</h2>
      <p>Hello,</p>
      <p>This is a reminder that your subscription payment for the <strong>${plan}</strong> plan is due on <strong>${dueDate}</strong>.</p>
      <p>Amount Due: <strong>${amount}</strong></p>
      <p>Please log in to your dashboard and proceed to the Billing section to settle the invoice.</p>
      <div style="margin: 30px 0;">
        <a href="https://app.tripbone.com" style="background-color: #005ea6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Invoice</a>
      </div>
    </div>
  `;
  return sendEmail({
    toEmail: email,
    subject: 'Action Required: Upcoming Tripbone Payment',
    htmlPart: html,
  });
};
