#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read web.json (not data.json)
const data = JSON.parse(fs.readFileSync('web.json', 'utf8'));

// Platform icons (копируем из js/data.js)
const platformIcons = {
  soundcloud: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 17.939h-1v-8.068c.308-.231.639-.429 1-.566v8.634zm3 0h1v-9.224c-.229.265-.443.548-.621.857l-.379-.184v8.551zm-2 0h1v-8.848c-.508-.079-.623-.05-1-.01v8.858zm-4 0h1v-7.02c-.312.458-.555.971-.692 1.535l-.308-.182v5.667zm-3-5.25c-.606.547-1 1.354-1 2.268 0 .914.394 1.721 1 2.268v-4.536zm18.879-.671c-.204-2.837-2.404-5.079-5.117-5.079-1.022 0-1.964.328-2.762.877v10.123h9.089c1.607 0 2.911-1.393 2.911-3.106 0-1.712-1.304-3.106-2.911-3.106l-.21.291z"/></svg>',
  spotify: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>',
  apple: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
  default: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>'
};

// Create tracks directory if it doesn't exist
const tracksDir = path.join(__dirname, 'track');
if (!fs.existsSync(tracksDir)) {
  fs.mkdirSync(tracksDir, { recursive: true });
}

// Function to generate slug from title
function generateSlug(title) {
  // Transliteration map for Cyrillic to Latin
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

  // Transliterate Cyrillic to Latin
  let slug = title.split('').map(char => cyrillicMap[char] || char).join('');

  return slug
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Generate page for each track
data.tracks.forEach(track => {
  const album = data.albums.find(a => a.id === track.albumId);
  const slug = generateSlug(track.title);

  // Skip tracks not available on web
  if (track.availability && track.availability.web === false) {
    return;
  }

  const trackTitle = escapeHtml(track.title);
  const albumTitle = album ? escapeHtml(album.title) : 'D10G3N';
  const lyrics = track.lyrics ? escapeHtml(track.lyrics).replace(/\n/g, '<br>') : 'Lyrics coming soon...';
  const year = track.year || album?.year || '2025';
  const coverUrl = track.cover || album?.cover || 'assets/placeholder.svg';

  // Generate links HTML
  let linksHtml = '';
  if (track.links && track.links.length > 0) {
    linksHtml = track.links.map(link => {
      const icon = platformIcons[link.platform] || platformIcons.default;
      const platformName = link.platform.charAt(0).toUpperCase() + link.platform.slice(1);
      return `          <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="modal-link">${icon}<span>${platformName}</span></a>`;
    }).join('\n');
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <meta name="description" content="${trackTitle} by D10G3N - Listen to this track from the album ${albumTitle}. Independent music, no algorithms, no trends.">
    <meta name="keywords" content="D10G3N, ${trackTitle}, ${albumTitle}, music, track, streaming, independent music">
    <meta property="og:title" content="${trackTitle} - D10G3N">
    <meta property="og:description" content="Listen to ${trackTitle} by D10G3N from the album ${albumTitle}">
    <meta property="og:type" content="music.song">
    <meta property="og:url" content="https://d10g3n.live/track/${slug}">
    <meta property="og:image" content="https://d10g3n.live/${coverUrl}">
    <meta property="music:musician" content="https://d10g3n.live">
    <meta property="music:release_date" content="${year}">
    <meta property="music:album" content="${albumTitle}">
    <link rel="canonical" href="https://d10g3n.live/track/${slug}">
    <link rel="alternate" hreflang="en" href="https://d10g3n.live/track/${slug}?lang=en">
    <link rel="alternate" hreflang="ru" href="https://d10g3n.live/track/${slug}?lang=ru">
    <link rel="alternate" hreflang="uk" href="https://d10g3n.live/track/${slug}?lang=uk">
    <link rel="alternate" hreflang="x-default" href="https://d10g3n.live/track/${slug}">
    <title>${trackTitle} - D10G3N | ${albumTitle}</title>
    <link rel="stylesheet" href="../../styles/main.css">
    <link rel="manifest" href="../../manifest.json">
    <meta name="theme-color" content="#1a1a2e">
    <link rel="icon" type="image/svg+xml" href="../../assets/placeholder.svg">

    <!-- Structured Data for Track -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      "name": "${trackTitle}",
      "url": "https://d10g3n.live/track/${slug}",
      "image": "https://d10g3n.live/${coverUrl}",
      "datePublished": "${year}",
      "byArtist": {
        "@type": "MusicGroup",
        "name": "D10G3N",
        "url": "https://d10g3n.live",
        "sameAs": [
          "https://open.spotify.com/artist/3OmPiKg36fYukLMOYBKfx7",
          "https://soundcloud.com/d10g3n",
          "https://www.youtube.com/@D10G3N-channel"
        ]
      },
      "inAlbum": {
        "@type": "MusicAlbum",
        "name": "${albumTitle}",
        "byArtist": {
          "@type": "MusicGroup",
          "name": "D10G3N"
        }
      }${track.isrc ? `,
      "isrcCode": "${track.isrc}"` : ''}
    }
    </script>
</head>
<body style="padding-bottom: 0 !important;">
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <a href="../../" style="color: inherit; text-decoration: none;">
                        <h1>D10G3N Live</h1>
                    </a>
                </div>
                <nav class="nav">
                    <button class="nav-toggle" aria-label="Toggle navigation" data-i18n="aria.toggleNav" data-i18n-attr="aria-label">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    <ul class="nav-menu">
                        <li><a href="../../#home" class="nav-link" data-i18n="nav.home">Home</a></li>
                        <li><a href="../../#albums" class="nav-link" data-i18n="nav.albums">Albums</a></li>
                        <li><a href="../../#tracks" class="nav-link" data-i18n="nav.tracks">Tracks</a></li>
                        <li><a href="../../#about" class="nav-link" data-i18n="nav.about">About</a></li>
                        <li class="lang-selector-item">
                            <select id="langSelect" class="lang-select" aria-label="Language selector">
                                <option value="en">EN</option>
                                <option value="ru">RU</option>
                                <option value="uk">UK</option>
                            </select>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="track-page-container">
      <div class="track-page-content">
        <a href="../../" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          <span data-i18n="track.backToHome">Back to Home</span>
        </a>
        
        <div class="track-header-static">
          <img src="../../${coverUrl}" alt="${trackTitle} cover" class="track-cover-large">
          <div class="track-details-static">
            <h1>${trackTitle}</h1>
            <p class="artist">D10G3N</p>
            <p class="album-info"><span data-i18n="track.album">Album</span>: ${albumTitle} • ${year}</p>
            ${track.isrc ? `<p class="album-info"><span data-i18n="track.isrc">ISRC</span>: ${track.isrc}</p>` : ''}
            
            ${linksHtml ? `<div class="track-links-static">
              <h3 data-i18n="track.listenOn">Listen on:</h3>
${linksHtml}
            </div>` : ''}
          </div>
        </div>
        
        ${track.lyrics ? `<div class="track-lyrics-static">
          <h2 data-i18n="track.lyrics">Lyrics</h2>
          <div>${lyrics}</div>
        </div>` : ''}
        
        ${track.youtubeId ? `<div class="track-video-static">
          <h3 data-i18n="track.watchOnYouTube">Watch on YouTube</h3>
          <div class="video-container">
            <iframe 
              width="560" 
              height="315" 
              src="https://www.youtube.com/embed/${track.youtubeId}" 
              title="YouTube video player" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowfullscreen>
            </iframe>
          </div>
        </div>` : ''}
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <p>&copy; D10G3N Live - All rights reserved.</p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem;">
                <a href="../../privacy-policy.html" style="color: var(--text-muted); text-decoration: none; transition: color 0.3s ease;">Privacy Policy</a>
                <span style="color: var(--text-muted); margin: 0 0.5rem;">|</span>
                <a href="../../copyright.html" style="color: var(--text-muted); text-decoration: none; transition: color 0.3s ease;">Copyright</a>
                <span style="color: var(--text-muted); margin: 0 0.5rem;">|</span>
                <a href="mailto:contact@d10g3n.live" style="color: var(--text-muted); text-decoration: none; transition: color 0.3s ease;">contact@d10g3n.live</a>
                <span style="color: var(--text-muted); margin: 0 0.5rem;">|</span>
                <span id="appVersion" style="color: var(--text-muted); font-size: 0.85rem;">v1.0</span>
            </p>
        </div>
    </footer>
    
    <script src="../../version.js"></script>
    <script src="../../js/i18n.js"></script>
    <script>
      // Initialize i18n and mobile menu on static track page
      document.addEventListener('DOMContentLoaded', function() {
        // Initialize i18n
        if (window.i18n) {
          window.i18n.updateUI();
          
          // Setup language selector
          const langSelect = document.getElementById('langSelect');
          if (langSelect && !langSelect._i18nInitialized) {
            langSelect._i18nInitialized = true;
            langSelect.value = window.i18n.getCurrentLanguage();
            
            langSelect.addEventListener('change', function(e) {
              if (window.i18n) {
                window.i18n.setLanguage(e.target.value);
              }
            });
          }
        }
        
        // Setup mobile menu toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        if (navToggle && navMenu) {
          navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
          });
        }
      });
    </script>
</body>
</html>`;

  // Create track directory
  const trackDir = path.join(tracksDir, slug);
  if (!fs.existsSync(trackDir)) {
    fs.mkdirSync(trackDir, { recursive: true });
  }

  // Write index.html
  fs.writeFileSync(path.join(trackDir, 'index.html'), html);
  console.log(`Generated: track/${slug}/index.html`);
});

console.log(`\n✅ Generated ${data.tracks.filter(t => !t.availability || t.availability.web !== false).length} track pages!`);

// Update JSON-LD in index.html
console.log('\n🔄 Updating JSON-LD in index.html...');
try {
  require('./update-jsonld.js');
} catch (e) {
  console.error('⚠️  Failed to update JSON-LD:', e.message);
}

// Update sitemap.xml
console.log('\n🔄 Updating sitemap.xml...');
try {
  require('./update-sitemap.js');
} catch (e) {
  console.error('⚠️  Failed to update sitemap:', e.message);
}


