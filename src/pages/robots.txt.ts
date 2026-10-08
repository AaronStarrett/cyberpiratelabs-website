import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const indexable = import.meta.env.PUBLIC_INDEXABLE === "true";
  const body = indexable
    ? `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /404\nSitemap: ${site}sitemap-index.xml\n`
    : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
};
