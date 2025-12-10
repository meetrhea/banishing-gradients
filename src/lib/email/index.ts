/**
 * Email Service - Provider Agnostic
 *
 * Usage:
 *   import { email } from '@/lib/email';
 *   await email.send({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi!</p>' });
 *
 * Configuration via environment variables:
 *   EMAIL_PROVIDER=resend|sendgrid|postmark|console (default: console)
 *   EMAIL_FROM=noreply@banishinggradients.com
 *   RESEND_API_KEY=re_xxx (if using resend)
 *   SENDGRID_API_KEY=SG.xxx (if using sendgrid)
 */

import type { EmailProvider, EmailMessage, EmailResult, BulkEmailResult, EmailConfig } from './types';
import { ConsoleEmailProvider } from './providers/console';
import { ResendEmailProvider } from './providers/resend';
import { SendGridEmailProvider } from './providers/sendgrid';

export * from './types';

class EmailService {
  private provider: EmailProvider;
  private config: EmailConfig;

  constructor() {
    this.config = this.loadConfig();
    this.provider = this.createProvider();
  }

  private loadConfig(): EmailConfig {
    const provider = (process.env.EMAIL_PROVIDER || 'console') as EmailConfig['provider'];

    return {
      provider,
      apiKey: this.getApiKey(provider),
      defaultFrom: process.env.EMAIL_FROM || 'Banishing Gradients <noreply@banishinggradients.meetrhea.com>',
      defaultReplyTo: process.env.EMAIL_REPLY_TO,
    };
  }

  private getApiKey(provider: string): string | undefined {
    switch (provider) {
      case 'resend':
        return process.env.RESEND_API_KEY;
      case 'sendgrid':
        return process.env.SENDGRID_API_KEY;
      case 'postmark':
        return process.env.POSTMARK_API_KEY;
      default:
        return undefined;
    }
  }

  private createProvider(): EmailProvider {
    const { provider, apiKey, defaultFrom } = this.config;

    switch (provider) {
      case 'resend':
        if (!apiKey) {
          console.warn('[Email] RESEND_API_KEY not set, falling back to console provider');
          return new ConsoleEmailProvider();
        }
        return new ResendEmailProvider(apiKey, defaultFrom);

      case 'sendgrid':
        if (!apiKey) {
          console.warn('[Email] SENDGRID_API_KEY not set, falling back to console provider');
          return new ConsoleEmailProvider();
        }
        return new SendGridEmailProvider(apiKey, defaultFrom);

      case 'console':
      default:
        return new ConsoleEmailProvider();
    }
  }

  /**
   * Get the current provider name
   */
  getProviderName(): string {
    return this.provider.name;
  }

  /**
   * Send a single email
   */
  async send(message: EmailMessage): Promise<EmailResult> {
    // Apply defaults
    const fullMessage: EmailMessage = {
      ...message,
      from: message.from || this.config.defaultFrom,
      replyTo: message.replyTo || this.config.defaultReplyTo,
    };

    console.log(`[Email] Sending via ${this.provider.name} to ${Array.isArray(message.to) ? message.to.join(', ') : message.to}`);

    const result = await this.provider.send(fullMessage);

    if (result.success) {
      console.log(`[Email] Sent successfully: ${result.messageId}`);
    } else {
      console.error(`[Email] Failed: ${result.error}`);
    }

    return result;
  }

  /**
   * Send multiple emails
   */
  async sendBulk(messages: EmailMessage[]): Promise<BulkEmailResult> {
    console.log(`[Email] Sending ${messages.length} emails via ${this.provider.name}`);

    const fullMessages = messages.map((msg) => ({
      ...msg,
      from: msg.from || this.config.defaultFrom,
      replyTo: msg.replyTo || this.config.defaultReplyTo,
    }));

    const result = await this.provider.sendBulk(fullMessages);

    console.log(`[Email] Bulk send complete: ${result.sent}/${result.total} sent, ${result.failed} failed`);

    return result;
  }

  /**
   * Verify the email provider connection is working
   */
  async verify(): Promise<boolean> {
    return this.provider.verifyConnection();
  }

  /**
   * Send a newsletter to all active subscribers
   */
  async sendNewsletter(subject: string, html: string, text?: string): Promise<BulkEmailResult> {
    // Import here to avoid circular dependency
    const { db } = await import('../db');

    const subscribers = db
      .prepare('SELECT email FROM subscribers WHERE unsubscribed = 0 AND confirmed = 1')
      .all() as { email: string }[];

    if (subscribers.length === 0) {
      console.log('[Email] No confirmed subscribers to send to');
      return { total: 0, sent: 0, failed: 0, results: [] };
    }

    const messages: EmailMessage[] = subscribers.map((sub) => ({
      to: sub.email,
      subject,
      html,
      text,
      tags: ['newsletter'],
    }));

    return this.sendBulk(messages);
  }
}

// Singleton instance
export const email = new EmailService();
