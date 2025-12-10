/**
 * Resend Email Provider
 *
 * https://resend.com - Modern email API with generous free tier (3,000/month)
 * Requires: RESEND_API_KEY environment variable
 */

import type { EmailProvider, EmailMessage, EmailResult, BulkEmailResult } from '../types';

export class ResendEmailProvider implements EmailProvider {
  name = 'resend';
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string) {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from || this.defaultFrom,
          to: Array.isArray(message.to) ? message.to : [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo,
          tags: message.tags?.map((tag) => ({ name: tag, value: 'true' })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendBulk(messages: EmailMessage[]): Promise<BulkEmailResult> {
    // Resend supports batch API, but for simplicity we'll send sequentially
    // Could optimize with batch endpoint: POST /emails/batch
    const results: EmailResult[] = [];

    for (const message of messages) {
      results.push(await this.send(message));
      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 100));
    }

    return {
      total: messages.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
