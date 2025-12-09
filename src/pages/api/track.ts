import type { APIRoute } from 'astro';

export const prerender = false; // This endpoint is server-rendered

interface TrackEvent {
  event: string;
  slug?: string;
  url?: string;
  referrer?: string;
  data?: Record<string, unknown>;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: TrackEvent = await request.json();
    const { event, slug, url, referrer, data } = body;

    if (!event) {
      return new Response(
        JSON.stringify({ success: false, error: 'Event type required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get client info
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // TODO: Save to database once Postgres is set up
    console.log(`[Track] ${event}`, {
      slug,
      url,
      referrer,
      userAgent: userAgent.substring(0, 100),
      ip,
      data,
      timestamp: new Date().toISOString(),
    });

    // Return 1x1 transparent pixel for image-based tracking fallback
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  } catch (error) {
    console.error('[Track] Error:', error);
    return new Response(
      JSON.stringify({ success: false }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Also support GET for simple pageview tracking via pixel
export const GET: APIRoute = async ({ request, url }) => {
  const event = url.searchParams.get('e') || 'pageview';
  const slug = url.searchParams.get('s') || '';
  const ref = url.searchParams.get('r') || '';

  console.log(`[Track/GET] ${event}`, { slug, referrer: ref });

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  return new Response(pixel, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
};
