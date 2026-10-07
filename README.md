# portfolio

Personal portfolio of Yagmur Şimşek Sönmez — built with [Astro](https://astro.build), deployed to GitHub Pages.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
```

## Structure

- `src/content/*.html` — page content (one file per case study; `home-*.html` for the homepage)
- `src/data/site.json` — page titles/descriptions and the hover-card data
- `src/scripts/site.js` — theme toggle, scroll spy, custom cursors, marquee, password gate
- `src/styles/site.css` — compiled Tailwind v4 stylesheet
- `public/images`, `public/videos` — media

## Images

Drop new PNG/JPG files into `public/images/` and run `npm run optimize-images`: they are converted to WebP
at the same pixel size (original files stay in git history), references are updated and 1200×630 share
images land in `public/og/`.

## Password-protected case study

`/projects/crypto-auth` is published encrypted (`public/crypto.enc.json`, AES-GCM + PBKDF2).
The plaintext lives in `private/` (git-ignored). To change the content or password:

```bash
CRYPTO_PASSWORD='new-password' npm run encrypt-crypto
```
