import { getMergedVideos } from '../lib/db';

export async function GET() {
  try {
    const appUrl = process.env.APP_URL || 'https://nudetrends.afrozex.com';

    // 1. Fetch all active/merged videos
    const mergedVideos = await getMergedVideos();

    // 2. Generate XML content
    const currentDate = new Date().toISOString();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add landing page
    xml += `  <url>\n`;
    xml += `    <loc>${appUrl}/</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Add category filters as dynamic pages
    xml += `  <url>\n`;
    xml += `    <loc>${appUrl}/?category=Trending%20Videos</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;

    xml += `  <url>\n`;
    xml += `    <loc>${appUrl}/?category=Nudes</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;

    // Add dynamic watch pages for all active videos in /watch/[id] format
    mergedVideos.forEach((video) => {
      xml += `  <url>\n`;
      xml += `    <loc>${appUrl}/watch/${video.id}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600'
      }
    });
  } catch (err: any) {
    console.error('Error generating sitemap XML:', err);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
