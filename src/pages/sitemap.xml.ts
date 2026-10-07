import type { APIRoute } from 'astro';
import site from '../data/site.json';

export const GET: APIRoute = ({ site: origin }) => {
  const paths = [
    '/',
    ...Object.entries(site.pages)
      .filter(([slug, page]) => slug !== 'home' && !('noindex' in page && page.noindex))
      .map(([slug]) => `/projects/${slug}/`),
  ];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, origin).href}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
