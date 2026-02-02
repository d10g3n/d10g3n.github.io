#!/bin/bash

# Auto-update version script
# Run this before each deployment to update cache version

# Generate version based on current date
VERSION="1.0.$(date +%Y%m%d%H%M)"

echo "Updating to version: $VERSION"

# Update index.html
sed -i.bak "s/\?v=[0-9.]*/?v=$VERSION/g" index.html && rm index.html.bak

# Update sw.js
sed -i.bak "s/CACHE_VERSION = '[0-9.]*'/CACHE_VERSION = '$VERSION'/g" sw.js && rm sw.js.bak

# Update manifest.json
sed -i.bak "s/\"version\": \"[0-9.]*\"/\"version\": \"$VERSION\"/g" manifest.json && rm manifest.json.bak
sed -i.bak "s/\?v=[0-9.]*/?v=$VERSION/g" manifest.json && rm manifest.json.bak

# Update version.js
sed -i.bak "s/APP_VERSION = '[0-9.]*'/APP_VERSION = '$VERSION'/g" version.js && rm version.js.bak

echo "✅ Version updated successfully to $VERSION"
echo ""
echo "Files updated:"
echo "  - index.html"
echo "  - sw.js"
echo "  - manifest.json"
echo "  - version.js"
echo ""
echo "You can now commit and push to GitHub Pages"
