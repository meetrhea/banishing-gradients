import type { APIRoute } from 'astro';
import { insertSubscriber, getSubscriberCount } from '../../lib/db';

export const prerender = false; // This endpoint is server-rendered

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email } = data;

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid email required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save to SQLite database
    insertSubscriber.run(email);

    const { count } = getSubscriberCount.get() as { count: number };
    console.log(`[Subscribe] New signup: ${email} (total: ${count})`);

    // TODO: Send welcome email via Resend/Postmark/etc.

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome to the resistance against gradients.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Subscribe] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Something went wrong' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
