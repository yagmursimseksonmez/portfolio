import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const image = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    year: z.string(),
    // One line under the title on the homepage card and the case page.
    summary: z.string(),
    tags: z.array(z.string()),
    // complete: full case study. rewriting / in-progress: short stub page.
    status: z.enum(['complete', 'rewriting', 'in-progress']),
    cover: image.optional(),
    // SEO
    description: z.string(),
    ogImage: z.string().default('/og.png'),
    noindex: z.boolean().default(false),
    // Case study details
    facts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    link: z.object({ label: z.string(), href: z.string() }).optional(),
    kicker: z.string().optional(),
    compare: z.object({ before: image, after: image }).optional(),
    diagram: image.extend({ label: z.string() }).optional(),
    rows: z
      .array(
        z.object({
          before: z.object({ title: z.string(), images: z.array(image) }),
          after: z.object({ title: z.string(), images: z.array(image) }),
        }),
      )
      .default([]),
    features: z.array(image.extend({ title: z.string() })).default([]),
  }),
});

export const collections = { projects };
