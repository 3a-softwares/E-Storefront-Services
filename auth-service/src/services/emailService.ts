import nodemailer from 'nodemailer';
import { Logger } from '@3asoftwares/utils/server';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
};

// Create transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) return transporter;

  // If no SMTP credentials, create a test account using Ethereal
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    Logger.info('No SMTP credentials found. Creating Ethereal test account...', undefined, 'Email');

    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      Logger.info(`Ethereal test account created: ${testAccount.user}`, undefined, 'Email');
    } catch (error) {
      Logger.error('Failed to create Ethereal test account', error, 'Email');
      throw new Error('Email service not configured');
    }
  } else {
    transporter = nodemailer.createTransport({
      ...emailConfig,
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });
    Logger.info(
      `Email transporter created with host: ${emailConfig.host}:${emailConfig.port}`,
      undefined,
      'Email'
    );
  }

  return transporter;
};

/**
 * Send an email
 */
export const sendEmail = async (
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> => {
  try {
    const transport = await getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"3A E-Commerce" <noreply3asoftwares.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    const info = await transport.sendMail(mailOptions);

    // Get preview URL for Ethereal emails
    const previewUrl = nodemailer.getTestMessageUrl(info);

    Logger.info(
      `Email sent successfully to ${options.to}`,
      {
        messageId: info.messageId,
        previewUrl: previewUrl || undefined,
      },
      'Email'
    );

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
    };
  } catch (error: any) {
    Logger.error(`Failed to send email to ${options.to}`, error, 'Email');
    throw error;
  }
};

/**
 * Send verification email
 */
export const sendVerificationEmailTemplate = async (
  to: string,
  name: string,
  verificationUrl: string
): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> => {
  const subject = 'Verify Your Email - 3A E-Commerce';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1f2937 0%, #4b5563 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">3A E-Commerce</h1>
                  <p style="color: #d1d5db; margin: 10px 0 0 0; font-size: 14px;">Your favorite online store</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi ${name},
                  </p>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    Thank you for creating an account with us! Please verify your email address by clicking the button below:
                  </p>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center">
                        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Verify Email Address
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 10px 0 30px 0;">
                    ${verificationUrl}
                  </p>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                    This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} 3A E-Commerce. All rights reserved.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                    This is an automated message. Please do not reply.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmailTemplate = async (
  to: string,
  name: string,
  resetUrl: string
): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> => {
  const subject = 'Reset Your Password - 3A E-Commerce';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1f2937 0%, #4b5563 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">3A E-Commerce</h1>
                  <p style="color: #d1d5db; margin: 10px 0 0 0; font-size: 14px;">Your favorite online store</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi ${name},
                  </p>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    We received a request to reset your password. Click the button below to create a new password:
                  </p>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 10px 0 30px 0;">
                    ${resetUrl}
                  </p>
                  
                  <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
                    <p style="color: #92400e; font-size: 14px; margin: 0;">
                      ⚠️ This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you're concerned.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} 3A E-Commerce. All rights reserved.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                    This is an automated message. Please do not reply.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
};
