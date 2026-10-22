import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const image = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  // A short label and line under a phone in a `device` board: what this screen is for.
  caption: z.object({ title: z.string(), text: z.string() }).optional(),
});

// A screen whose top banner and bottom nav stay put while the middle scrolls.
// `foot` is the nav bar plus its round button on a transparent background; it floats over the scrolling
// content, and `nav` is the height of the bar itself (in source pixels), used to leave room at the end.
// `open`: the image is a link that opens the full-size file in a new tab, for boards too small to read in the strip.
const pinnedImage = image.extend({ open: z.boolean().default(false), head: image.optional(), foot: image.extend({ nav: z.number() }).optional() });

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
        // A long title (three lines or more) gets a smaller size so the pitch still fits the page.
        compact: z.boolean().default(false),
        // The whole pitch page is a finished page in `src/content/playmate-frames/<name>.html`.
        frame: z.string().optional(),
        lede: z.string(),
        // The pixel HP bar under the lede: how many of its 10 segments are filled.
        hp: z.object({ value: z.number().min(0).max(10), label: z.string() }).optional(),
        // `label` replaces the running number, e.g. Role, Problem, Solution, Impact.
        points: z.array(z.object({ label: z.string().optional(), title: z.string(), text: z.string() })).default([]),
        chips: z.array(z.string()).default([]),
        // A yellow concept panel instead of a plain phone: a tilted phone playing the video, with words floating around it.
        concept: z
          .object({
            video: z.object({ src: z.string(), width: z.number(), height: z.number(), label: z.string() }),
            // x and y are percentages of the panel; rotate is in degrees.
            words: z.array(z.object({ text: z.string(), tone: z.enum(['green', 'sky', 'pink', 'navy']), x: z.number(), y: z.number(), rotate: z.number().default(0) })).default([]),
            // The whole panel (yellow, phone and words) is already one finished video: just play it, 3:2.
            flat: z.boolean().default(false),
          })
          .optional(),
        // Omit when the folder also has a `showcase`: the hero then shows that (video over a still) instead.
        video: z.object({ src: z.string(), width: z.number(), height: z.number(), label: z.string() }).optional(),
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
          title: z.string().optional(),
          // A finished page of its own, in `src/content/playmate-frames/<name>.html` (designed at 700px tall, scaled to fit).
          frame: z.string().optional(),
          // A numbered step heading instead of label and title: a big number, a name and one line of text.
          step: z.object({ n: z.string(), name: z.string().optional(), text: z.string().optional() }).optional(),
          // With `beats`: show them in the folder's last column, above the facts, instead of as a page of the strip.
          info: z.boolean().default(false),
          // With `beats`: lay them out as a 2 × 2 grid of cards.
          grid: z.boolean().default(false),
          // With `beats`: stack them in one narrow column, each with a big heading.
          stack: z.boolean().default(false),
          // With `src`: short notes beside the picture, each tied to a numbered dashed box on it.
          // x, y, w and h place the box, in percentages of the picture; the first half of the notes sits on the left, the rest on the right.
          notes: z.array(z.object({ n: z.string(), title: z.string(), text: z.string(), x: z.number(), y: z.number(), w: z.number(), h: z.number() })).optional(),
          // Columns of cards and pictures, laid out side by side under the heading. A column holds stacked
          // `cards`, one `image` (as tall as the frame, with an optional tag), or `rows` of cards side by side.
          // `grow` sets how much room a card takes next to its neighbours; `width` is the column's width in px.
          panels: z
            .array(
              z.object({
                title: z.string().optional(),
                width: z.number().optional(),
                cards: z.array(z.object({ title: z.string(), text: z.string().optional(), items: z.array(z.string()).default([]), grow: z.number().default(1) })).default([]),
                image: image.extend({ label: z.string().optional() }).optional(),
                rows: z.array(z.array(z.object({ title: z.string(), text: z.string().optional(), items: z.array(z.string()).default([]), grow: z.number().default(1) }))).default([]),
              }),
            )
            .optional(),
          src: z.string().optional(),
          alt: z.string().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          items: z.array(pinnedImage).optional(),
          // Long scrolling screens: shown larger and cropped, they open downward and pan on hover.
          tall: z.boolean().default(false),
          // Bare app screens: equal width, phone proportions, rounded corners.
          screens: z.boolean().default(false),
          // Like `screens`, but every screen sits inside an iPhone frame.
          device: z.boolean().default(false),
          // With `device`: screens taller than the frame scroll inside it, under the visitor's own wheel or finger.
          scroll: z.boolean().default(false),
          // With `beats`: stack them as full-width rows (big letter on the left, text on the right) instead of tall columns,
          // for short text that would leave columns empty.
          rows: z.boolean().default(false),
          // A text board told in STAR beats (Situation, Task, Action, Result) instead of images.
          beats: z
            .array(
              z.object({
                letter: z.string().default(''),
                name: z.string(),
                text: z.string().optional(),
                points: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
                stats: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
                quote: z.string().optional(),
                // A picture under the beat's text, filling the rest of its column, e.g. the real board it summarises.
                // It keeps the picture's own proportions and scrolls inside its panel when taller than the column.
                image: image.optional(),
                // Several pictures under the beat's text, stacked in one scrolling panel; `label` is a line above a picture.
                images: z.array(image.extend({ label: z.string().optional() })).default([]),
                // More than 1: a wider column whose points sit side by side in this many columns, row by row.
                columns: z.number().min(1).max(5).default(1),
                // A wider column with its stats in two columns, for a beat that carries numbers.
                wide: z.boolean().default(false),
              }),
            )
            .optional(),
        }),
      )
      .default([]),
    // Last page of the strip: a phone that runs the clickable prototype (`src`, an embed URL), or shows
    // `poster` with the button disabled until the prototype is ready.
    prototype: z
      .object({
        // A finished page in `src/content/playmate-frames/<name>.html` instead of the built-in layout.
        frame: z.string().optional(),
        label: z.string().default('Prototype'),
        title: z.string(),
        text: z.string(),
        poster: image.optional(),
        src: z.string().optional(),
        href: z.string().optional(),
        cta: z.string().default('Open the prototype'),
      })
      .optional(),
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
