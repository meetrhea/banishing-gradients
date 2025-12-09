import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    excerpt: z.string(),
    author: z.string(),
    authorTitle: z.string().optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: z.enum([
      'Industry News',
      'Research',
      'Startup Culture',
      'Corporate',
      'Opinion',
      'Breaking',
    ]),
    tags: z.array(z.string()),
    imageUrl: z.string().optional(),
    imageAlt: z.string().optional(),
    imageCredit: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { articles };
