import { defineCollection, z } from 'astro:content';

// Valid author slugs - must match src/data/authors.ts
const authorSlugs = [
  'chester-worthington-iii',
  'margaret-mcallister',
  'harold-finch-jr',
  'rita-chen',
] as const;

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    excerpt: z.string(),
    author: z.enum(authorSlugs),
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
