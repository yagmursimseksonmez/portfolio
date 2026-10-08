import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site: origin }) => {
  const projects = await getCollection('projects', (p) => !p.data.noindex);
  const paths = ['/', ...projects.sort((a, b) => a.data.order - b.data.order).map((p) => `/projects/${p.id}/`)];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, origin).href}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
