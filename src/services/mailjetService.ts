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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #005ea6;">Welcome to Tripbone!</h2>
      <p>Hi ${name},</p>
      <p>We are thrilled to have you on board. Your account has been successfully created.</p>
      <p>Log in to your dashboard to start setting up your travel workspaces and building your storefronts.</p>
      <div style="margin: 30px 0;">
        <a href="https://app.tripbone.com" style="background-color: #005ea6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
      </div>
      <p style="color: #666; font-size: 12px;">If you didn't create this account, please ignore this email.</p>
    </div>
  `;
  return sendEmail({
    toEmail: email,
    toName: name,
    subject: 'Welcome to Tripbone!',
    htmlPart: html,
  });
};

export const sendVerificationEmail = async (email: string, link: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #005ea6;">Verify your Email</h2>
      <p>Hello,</p>
      <p>Thank you for registering with Tripbone. Please confirm your email address by clicking the link below:</p>
      <div style="margin: 30px 0;">
        <a href="${link}" style="background-color: #00b272; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirm Email</a>
      </div>
      <p style="color: #666; font-size: 12px;">This link will expire soon. If you didn't request this, please safely ignore it.</p>
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
