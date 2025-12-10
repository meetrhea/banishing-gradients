/**
 * Console Email Provider
 *
 * Development/testing provider that logs emails to console.
 * Use this when no real email provider is configured.
 */

import type { EmailProvider, EmailMessage, EmailResult, BulkEmailResult } from '../types';

export class ConsoleEmailProvider implements EmailProvider {
  name = 'console';

  async send(message: EmailMessage): Promise<EmailResult> {
    const to = Array.isArray(message.to) ? message.to.join(', ') : message.to;

    console.log('\n📧 ═══════════════════════════════════════════');
    console.log('   EMAIL (Console Provider - Not Actually Sent)');
    console.log('═══════════════════════════════════════════════');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${message.subject}`);
    console.log(`From:    ${message.from || 'default'}`);
    if (message.replyTo) console.log(`Reply:   ${message.replyTo}`);
    if (message.tags?.length) console.log(`Tags:    ${message.tags.join(', ')}`);
    console.log('───────────────────────────────────────────────');
    if (message.text) {
      console.log(message.text.substring(0, 500));
      if (message.text.length > 500) console.log('... (truncated)');
    } else if (message.html) {
      console.log('[HTML content - see logs for preview]');
    }
    console.log('═══════════════════════════════════════════════\n');

    return {
      success: true,
      messageId: `console-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  async sendBulk(messages: EmailMessage[]): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];

    for (const message of messages) {
      results.push(await this.send(message));
    }

    return {
      total: messages.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  async verifyConnection(): Promise<boolean> {
    console.log('[Console Email Provider] Connection verified (no-op)');
    return true;
  }
}
