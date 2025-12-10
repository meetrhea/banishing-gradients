/**
 * Email Provider Abstraction Layer
 *
 * Allows swapping email providers without changing application code.
 * Supports: Resend, SendGrid, Postmark, Console (dev), or custom SMTP.
 */

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string; // Defaults to configured sender
  replyTo?: string;
  tags?: string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResult {
  total: number;
  sent: number;
  failed: number;
  results: EmailResult[];
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<EmailResult>;
  sendBulk(messages: EmailMessage[]): Promise<BulkEmailResult>;
  verifyConnection(): Promise<boolean>;
}

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'postmark' | 'console' | 'smtp';
  apiKey?: string;
  defaultFrom: string;
  defaultReplyTo?: string;

  // SMTP-specific
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}
