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
    // Show a "See more" link on the folder's info card when there is no `link`.
    seeMore: z.boolean().default(true),
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
    // Opens the folder strip: a still with a muted, looping screen recording laid over its left side.
    showcase: z.object({ image, video: z.object({ src: z.string(), width: z.number(), height: z.number(), label: z.string() }) }).optional(),
    // Plays first in the folder strip, muted and looping.
    video: z.object({ src: z.string(), width: z.number(), height: z.number(), label: z.string() }).optional(),
    // Extra full-width boards after the cover, each with a small label and a title.
    gallery: z.array(image.extend({ label: z.string(), title: z.string() })).default([]),
  }),
});

export const collections = { projects };
