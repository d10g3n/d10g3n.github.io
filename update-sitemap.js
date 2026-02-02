#!/usr/bin/env node

const fs = require('fs');

// Read web.json
const data = JSON.parse(fs.readFileSync('web.json', 'utf8'));

// Function to generate slug
function generateSlug(title) {
  const cyrillicMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', 'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H',
    'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E',
    'Ю': 'Yu', 'Я': 'Ya', 'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g'
  };

  let slug = title.split('').map(char => cyrillicMap[char] || char).join('');

  return slug
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const today = new Date().toISOString().split('T')[0];

// Generate sitemap XML
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!-- Main page -->
  <url>
    <loc>https://d10g3n.live</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://d10g3n.live?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ru" href="https://d10g3n.live?lang=ru"/>
    <xhtml:link rel="alternate" hreflang="uk" href="https://d10g3n.live?lang=uk"/>
  </url>
  
  <!-- Privacy Policy -->
  <url>
    <loc>https://d10g3n.live/privacy-policy.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Copyright -->
  <url>
    <loc>https://d10g3n.live/copyright.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Tracks with language alternatives -->
`;

// Add tracks
data.tracks.forEach(track => {
  // Skip tracks not available on web
  if (track.availability && track.availability.web === false) {
    return;
  }

  const slug = generateSlug(track.title);

  sitemap += `  <url>
    <loc>https://d10g3n.live/track/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://d10g3n.live/track/${slug}?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ru" href="https://d10g3n.live/track/${slug}?lang=ru"/>
    <xhtml:link rel="alternate" hreflang="uk" href="https://d10g3n.live/track/${slug}?lang=uk"/>
  </url>
  
`;
});

sitemap += `</urlset>
`;

// Write sitemap.xml
fs.writeFileSync('sitemap.xml', sitemap);
console.log(`✅ Updated sitemap.xml with ${data.tracks.filter(t => !t.availability || t.availability.web !== false).length} tracks`);

