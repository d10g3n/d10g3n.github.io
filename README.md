# D10G3N Music - Streaming Platform

Official music streaming platform for D10G3N tracks.

## 🚀 Deployment

### Before Each Deployment

To ensure users get the latest version without clearing cache, run the version update script:

```bash
./update-version.sh
```

This script automatically updates version strings in:
- `index.html` - CSS and JS file references
- `sw.js` - Service Worker cache version
- `manifest.json` - App manifest version
- `version.js` - Application version constant

### Deploy to GitHub Pages

```bash
# 1. Update version
./update-version.sh

# 2. Commit changes
git add .
git commit -m "Release version X.X.YYYYMMDDHHMM"

# 3. Push to GitHub
git push origin main
```

## 🔧 Cache Strategy

The application uses a **Network-First** caching strategy for:
- HTML files
- JavaScript files
- CSS files
- JSON data files

And **Cache-First** strategy for:
- Images
- Audio files
- Other static assets

This ensures users always get the latest code while benefiting from cached media files.

## 📝 Manual Version Update

If you prefer to update the version manually, change the version string in these files:

1. `index.html` - Update `?v=X.X.XXXXXXXX` in CSS and JS links
2. `sw.js` - Update `CACHE_VERSION = 'X.X.XXXXXXXX'`
3. `manifest.json` - Update `"version": "X.X.XXXXXXXX"` and start_url
4. `version.js` - Update `APP_VERSION = 'X.X.XXXXXXXX'`

Version format: `MAJOR.MINOR.YYYYMMDDHHMM`

## 🌐 Features

- Progressive Web App (PWA)
- Offline support via Service Worker
- Responsive design (mobile & desktop)
- **Multi-language support** (English, Russian, Ukrainian) 🌍
- Background audio playback
- Album organization
- Track queue management
- Share track URLs
- SEO optimized

## 🌍 Localization

The app supports 3 languages:
- 🇬🇧 English
- 🇷🇺 Русский
- 🇺🇦 Українська

Language is automatically detected from browser settings and can be changed via the selector in the navigation menu. For more details, see [LOCALIZATION.md](LOCALIZATION.md).

## 📱 Mobile App

Available on Google Play: [D10G3N Music](https://play.google.com/store/apps/details?id=com.d10g3n.live.music)

## 📄 License

All music and content © D10G3N. See [copyright.html](copyright.html) for details.
