import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import sharp from 'sharp';

// Prerender all OG images at build time
export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const articles = await getCollection('articles');
  return articles.map((article) => ({
    params: { slug: article.slug },
    props: { article },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { article } = props as { article: Awaited<ReturnType<typeof getCollection>>[0] };
  const { title, category } = article.data;

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
          backgroundColor: '#faf9f6', // Cream/newspaper color
          padding: '60px',
          fontFamily: 'Playfair Display',
        },
        children: [
          // Top border
          {
            type: 'div',
            props: {
              style: {
                width: '100%',
                height: '8px',
                backgroundColor: '#c52f2f',
                marginBottom: '30px',
              },
            },
          },
          // Header
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px',
              },
              children: {
                type: 'span',
                props: {
                  style: {
                    fontSize: '32px',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: '#1a1a1a',
                  },
                  children: 'BANISHING GRADIENTS',
                },
              },
            },
          },
          // Divider line
          {
            type: 'div',
            props: {
              style: {
                width: '100%',
                height: '2px',
                backgroundColor: '#1a1a1a',
                marginBottom: '40px',
              },
            },
          },
          // Category
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                marginBottom: '20px',
              },
              children: {
                type: 'span',
                props: {
                  style: {
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#c52f2f',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  },
                  children: category,
                },
              },
            },
          },
          // Headline
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flex: 1,
                alignItems: 'center',
              },
              children: {
                type: 'span',
                props: {
                  style: {
                    fontSize: title.length > 80 ? '42px' : title.length > 50 ? '52px' : '60px',
                    fontWeight: 900,
                    color: '#1a1a1a',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  },
                  children: title,
                },
              },
            },
          },
          // Bottom divider
          {
            type: 'div',
            props: {
              style: {
                width: '100%',
                height: '2px',
                backgroundColor: '#1a1a1a',
                marginTop: '40px',
                marginBottom: '20px',
              },
            },
          },
          // Footer
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'center',
              },
              children: {
                type: 'span',
                props: {
                  style: {
                    fontSize: '16px',
                    color: '#666',
                    fontStyle: 'italic',
                  },
                  children: "America's Finest AI News Source",
                },
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
