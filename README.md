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

## Password-protected case study

`/projects/crypto-auth` is published encrypted (`public/crypto.enc.json`, AES-GCM + PBKDF2).
The plaintext lives in `private/` (git-ignored). To change the content or password:

```bash
CRYPTO_PASSWORD='new-password' npm run encrypt-crypto
```
