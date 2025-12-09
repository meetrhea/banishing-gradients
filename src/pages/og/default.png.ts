import type { APIRoute } from 'astro';
import satori from 'satori';
import sharp from 'sharp';

// Prerender at build time
export const prerender = true;

export const GET: APIRoute = async () => {
  // Fetch the Playfair Display font
  const fontData = await fetch(
    'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtY.ttf'
  ).then((res) => res.arrayBuffer());

  // Create the SVG using satori
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#faf9f6',
          padding: '60px',
          fontFamily: 'Playfair Display',
        },
        children: [
          // Top border
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '12px',
                backgroundColor: '#c52f2f',
              },
            },
          },
          // Main title
          {
            type: 'div',
            props: {
              style: {
                fontSize: '72px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#1a1a1a',
                marginBottom: '30px',
              },
              children: 'BANISHING GRADIENTS',
            },
          },
          // Divider
          {
            type: 'div',
            props: {
              style: {
                width: '600px',
                height: '4px',
                backgroundColor: '#1a1a1a',
                marginBottom: '30px',
              },
            },
          },
          // Tagline
          {
            type: 'div',
            props: {
              style: {
                fontSize: '28px',
                color: '#666',
                fontStyle: 'italic',
              },
              children: "America's Finest AI News Source",
            },
          },
          // Bottom border
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '12px',
                backgroundColor: '#c52f2f',
              },
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Playfair Display',
          data: fontData,
          weight: 900,
          style: 'normal',
        },
      ],
    }
  );

  // Convert SVG to PNG using sharp
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
