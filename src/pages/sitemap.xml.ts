import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site: origin }) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${new URL('/', origin).href}</loc></url>\n  <url><loc>${new URL('/projects/playmate/', origin).href}</loc></url>\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
