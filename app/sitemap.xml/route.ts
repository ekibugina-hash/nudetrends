import { getMergedVideos, getCreators } from '../lib/db';

export const revalidate = 3600; // Regenerate sitemap at most once per hour

export async function GET() {
  try {
    const appUrl = process.env.APP_URL || 'https://nudetrends.afrozex.com';

    // Fetch both trends and merged videos
    const [creators, mergedVideos] = await Promise.all([
      getCreators(),
      getMergedVideos(),
    ]);

    const currentDate = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Homepage — highest priority
    xml += `  <url>\n`;
    xml += `    <loc>${appUrl}/</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // 2. Trend Pages (/creator/[name]) — high priority
    creators.forEach((creator) => {
      xml += `  <url>\n`;
      xml += `    <loc>${appUrl}/creator/${encodeURIComponent(creator.name)}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    });

    // 3. Watch Pages (/watch/[id])
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
