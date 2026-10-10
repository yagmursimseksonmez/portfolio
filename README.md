# portfolio

Personal portfolio of Yagmur Şimşek Sönmez — built with [Astro](https://astro.build), deployed to GitHub Pages.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
```

## Structure

The site is one fixed screen, modelled on maciej.co: a particle hero, a stack of project folders that open
full screen and scroll sideways, and a "Hi" book behind them for the about page. `/#ikeep` or `/#about`
opens a folder or the book directly.

- `src/content/projects/*.md` — one file per project. `order` sets its place in the stack (1 = top);
  frontmatter fills the folder (cover, compare, diagram, before/after `rows`, `features`), the Markdown
  body is the Scope text. `status: rewriting` / `in-progress` shows just the cover and a short note.
  Schema: `src/content.config.ts`.
- `src/pages/index.astro` — the whole page, including the contact panel and the about book (bio, timeline)
- `src/styles/site.css` — all styles and animations
- `src/scripts/site.js` — hero particles, folder stack, book, timeline, contact panel, intro

## Images

Drop new PNG/JPG files into `public/images/` and run `npm run optimize-images`: they are converted to WebP
at the same pixel size (original files stay in git history), references are updated and 1200×630 share
images land in `public/og/`.
