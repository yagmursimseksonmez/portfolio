import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const staged = import.meta.env.PUBLIC_NOINDEX === 'true';
  const body = staged
    ? 'User-agent: *\nDisallow:\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
