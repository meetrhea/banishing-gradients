import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export const prerender = true;

export async function GET(context: APIContext) {
  const articles = await getCollection('articles');
  const sortedArticles = articles.sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()
  );

  return rss({
    title: 'Banishing Gradients',
    description: "America's Finest AI News Source",
    site: context.site || 'https://banishinggradients.com',
    items: sortedArticles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.publishedAt,
      description: article.data.excerpt,
      link: `/article/${article.slug}/`,
      categories: [article.data.category],
      author: article.data.author,
    })),
    customData: `<language>en-us</language>`,
  });
}
