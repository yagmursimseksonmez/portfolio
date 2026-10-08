# portfolio

Personal portfolio of Yagmur Şimşek Sönmez — built with [Astro](https://astro.build), deployed to GitHub Pages.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
```

## Structure

- `src/content/projects/*.md` — one file per case study. Frontmatter holds the card, facts and image sections;
  the Markdown body is the project snapshot text. `status: complete` renders the full case study,
  `rewriting` / `in-progress` render a short stub page. Schema: `src/content.config.ts`.
- `src/pages/index.astro` — homepage (hero, selected work, experience, about)
- `src/components/` — top bar and footer
- `src/styles/site.css` — design tokens and all styles (dark "midnight gallery" system)
- `src/scripts/site.js` — Berlin clock, hero mural sizing, before/after slider
- `public/images`, `public/videos` — media

## Adding or rewriting a case study

Edit (or copy) a file in `src/content/projects/`. Set `status: complete` once the case is ready; fill `rows`
for before/after pairs and `features` for a screenshot grid. `order` sets its position on the homepage.

## Images

Drop new PNG/JPG files into `public/images/` and run `npm run optimize-images`: they are converted to WebP
at the same pixel size (original files stay in git history), references are updated and 1200×630 share
images land in `public/og/`.
