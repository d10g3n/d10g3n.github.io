#!/usr/bin/env node

const fs = require('fs');

// Read web.json
const data = JSON.parse(fs.readFileSync('web.json', 'utf8'));

// Generate albums array for JSON-LD
const albums = data.albums.map(album => ({
  "@type": "MusicAlbum",
  "name": album.title,
  "datePublished": album.year.toString(),
  "image": `https://d10g3n.live/${album.cover}`,
  "byArtist": {
    "@type": "MusicGroup",
    "name": "D10G3N"
  }
}));

// Create JSON-LD structure
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  "name": "D10G3N",
  "url": "https://d10g3n.live",
  "logo": "https://d10g3n.live/assets/placeholder.svg",
  "description": "Independent music artist. No algorithms, no trends, just sound and emotions.",
  "genre": ["Electronic", "Hip-Hop"],
  "sameAs": data.artistLinks ? data.artistLinks.map(link => link.url) : [
    "https://open.spotify.com/artist/3OmPiKg36fYukLMOYBKfx7",
    "https://soundcloud.com/d10g3n",
    "https://www.youtube.com/@D10G3N-channel",
    "https://instagram.com/the_d10g3n",
    "https://tiktok.com/@the_d10g3n"
  ],
  "album": albums
};

// Format JSON with proper indentation
const jsonLdString = JSON.stringify(jsonLd, null, 2);

// Read index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');

// Find and replace JSON-LD section
const jsonLdStart = indexHtml.indexOf('<!-- Structured Data -->');
const jsonLdEnd = indexHtml.indexOf('</script>', jsonLdStart) + '</script>'.length;

if (jsonLdStart !== -1 && jsonLdEnd !== -1) {
  const newJsonLdSection = `<!-- Structured Data -->
    <script type="application/ld+json">
    ${jsonLdString}
    </script>`;

  indexHtml = indexHtml.substring(0, jsonLdStart) + newJsonLdSection + indexHtml.substring(jsonLdEnd);

  // Write back to index.html
  fs.writeFileSync('index.html', indexHtml);
  console.log('✅ Updated JSON-LD in index.html');
} else {
  console.error('❌ Could not find JSON-LD section in index.html');
}

