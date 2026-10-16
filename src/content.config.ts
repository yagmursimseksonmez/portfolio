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
    // A full case-study page; when set, "See more" links there.
    page: z.string().optional(),
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
    // First page of the folder strip: a screen recording in a phone frame beside a short, scannable pitch.
    hero: z
      .object({
        kicker: z.string(),
        title: z.string(),
        lede: z.string(),
        // The pixel HP bar under the lede: how many of its 10 segments are filled.
        hp: z.object({ value: z.number().min(0).max(10), label: z.string() }).optional(),
        points: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
        chips: z.array(z.string()).default([]),
        video: z.object({ src: z.string(), width: z.number(), height: z.number(), label: z.string() }),
      })
      .optional(),
    // Plays first in the folder strip, muted and looping.
    video: z.object({ src: z.string(), width: z.number(), height: z.number(), label: z.string() }).optional(),
    // Extra boards after the cover, each with a small label and a title. A board shows one image
    // (`src`) or several screens side by side (`items`); an item whose src ends in .mp4 plays as video.
    gallery: z
      .array(
        z.object({
          label: z.string(),
          title: z.string(),
          src: z.string().optional(),
          alt: z.string().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          items: z.array(image).optional(),
          // Long scrolling screens: shown larger and cropped, they open downward and pan on hover.
          tall: z.boolean().default(false),
          // Bare app screens: equal width, phone proportions, rounded corners.
          screens: z.boolean().default(false),
          // Like `screens`, but every screen sits inside an iPhone frame.
          device: z.boolean().default(false),
          // With `device`: screens taller than the frame scroll inside it, under the visitor's own wheel or finger.
          scroll: z.boolean().default(false),
          // A text board told in STAR beats (Situation, Task, Action, Result) instead of images.
          beats: z
            .array(
              z.object({
                letter: z.string(),
                name: z.string(),
                text: z.string().optional(),
                points: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
                stats: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
                quote: z.string().optional(),
                // A wider column with its stats in two columns, for a beat that carries numbers.
                wide: z.boolean().default(false),
              }),
            )
            .optional(),
        }),
      )
      .default([]),
    // "See more" opens these as a short read in a side panel: a label, then text, points or stats.
    details: z
      .array(
        z.object({
          label: z.string(),
          title: z.string().optional(),
          text: z.string().optional(),
          points: z.array(z.string()).default([]),
          stats: z.array(z.object({ value: z.string(), issue: z.string(), fix: z.string().optional() })).default([]),
          images: z.array(image).default([]),
        }),
      )
      .default([]),
  }),
});

export const collections = { projects };
