/**
 * SendGrid Email Provider
 *
 * https://sendgrid.com - Established email platform
 * Requires: SENDGRID_API_KEY environment variable
 */

import type { EmailProvider, EmailMessage, EmailResult, BulkEmailResult } from '../types';

export class SendGridEmailProvider implements EmailProvider {
  name = 'sendgrid';
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string) {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const to = Array.isArray(message.to) ? message.to : [message.to];

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: to.map((email) => ({ email })) }],
          from: { email: message.from || this.defaultFrom },
          subject: message.subject,
          content: [
            message.text ? { type: 'text/plain', value: message.text } : null,
            message.html ? { type: 'text/html', value: message.html } : null,
          ].filter(Boolean),
          reply_to: message.replyTo ? { email: message.replyTo } : undefined,
          categories: message.tags,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: false,
          error: data.errors?.[0]?.message || `HTTP ${response.status}`,
        };
      }

      // SendGrid returns message ID in header
      const messageId = response.headers.get('X-Message-Id');

      return {
        success: true,
        messageId: messageId || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendBulk(messages: EmailMessage[]): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];

    for (const message of messages) {
      results.push(await this.send(message));
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
      // SendGrid doesn't have a simple ping endpoint, so we check scopes
      const response = await fetch('https://api.sendgrid.com/v3/scopes', {
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
