import { getMergedVideos } from '../lib/db';

export const revalidate = 3600; // Regenerate sitemap at most once per hour

export async function GET() {
  try {
    const appUrl = process.env.APP_URL || 'https://nudetrends.afrozex.com';

    // Fetch all active/merged videos
    const mergedVideos = await getMergedVideos();

    const currentDate = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Homepage — highest priority
    xml += `  <url>\n`;
    xml += `    <loc>${appUrl}/</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Add a /watch/[id] page for every single video/image
    mergedVideos.forEach((video) => {
      const lastmod = video.uploadedAt
        ? new Date(video.uploadedAt).toISOString()
        : currentDate;

      xml += `  <url>\n`;
      xml += `    <loc>${appUrl}/watch/${encodeURIComponent(video.id)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    console.error('Error generating sitemap XML:', err);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
