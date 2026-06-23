# fonts-cdn

A lightweight template repository for self-hosting webfonts via GitHub + jsDelivr. 
Perfect for CJK fonts and artistic fonts not covered by mainstream CDNs.

## Features

- woff2 format, jsDelivr CDN
- Per-font version locking via GitHub Releases
- Automated updates via fetch scripts
- Lifecycle management: add, update, deprecate
- Strict license validation

## Quick Start (As User)

```html
<link rel="stylesheet" 
      href="https://cdn.jsdelivr.net/gh/USER/fonts-cdn@FONT-ID@VERSION/dist/css/FONT-ID.css">

<style>
  body { font-family: 'Sarasa Mono SC', monospace; }
</style>
```

Example:
```html
<link rel="stylesheet" 
      href="https://cdn.jsdelivr.net/gh/scillidan/fonts-cdn@sarasa-mono-sc@1.0.39/dist/css/sarasa-mono-sc.css">
```

## Quick Start (As Maintainer)

### Use this template

1. Click "Use this template" → Create new repository
2. Clone your repo
3. Add fonts to `fonts/active/`
4. Push changes

### Or clone directly

```bash
git clone https://github.com/scillidan/fonts-cdn.git my-fonts
cd my-fonts
rm -rf fonts/active/*  # Remove example fonts
```

## Adding a Font

### Option A: Manual (for fonts without upstream automation)

```bash
mkdir fonts/active/my-font
# Add woff2 files
# Create font.json
```

### Option B: With fetch script (for GitHub-released fonts)

1. Create directory and fetch script:

```bash
mkdir fonts/active/my-font
```

Create `fonts/active/my-font/fetch.sh`:

```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION="${1:-}"

# Get latest version if not specified
if [ -z "$VERSION" ]; then
    VERSION=$(curl -sL https://api.github.com/repos/OWNER/REPO/releases/latest | jq -r '.tag_name' | sed 's/^v//')
fi

# Download and convert
DOWNLOAD_URL="https://github.com/OWNER/REPO/releases/download/v${VERSION}/ASSET-${VERSION}.zip"
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

curl -sL -o "$TEMP_DIR/font.zip" "$DOWNLOAD_URL"
unzip -q "$TEMP_DIR/font.zip" -d "$TEMP_DIR/extracted"

for ttf in "$TEMP_DIR/extracted"/*.ttf; do
    woff2_compress "$ttf"
done

mv "$TEMP_DIR/extracted"/*.woff2 "$SCRIPT_DIR/"

# Update version in font.json
if [ -f "$SCRIPT_DIR/font.json" ] && command -v jq &>/dev/null; then
    tmp=$(mktemp)
    jq ".version = \"$VERSION\"" "$SCRIPT_DIR/font.json" > "$tmp"
    mv "$tmp" "$SCRIPT_DIR/font.json"
fi
```

2. Create `font.json` with fetch metadata:

```json
{
  "$schema": "../../../font.schema.json",
  "id": "my-font",
  "name": "My Font",
  "version": "1.0.0",
  "license": { "spdx": "OFL-1.1", "url": "..." },
  "source": { "url": "https://github.com/OWNER/REPO", "type": "github" },
  "fetch": {
    "script": "fetch.sh",
    "upstreamRepo": "OWNER/REPO",
    "assetPattern": "FontName-TTF-{version}.zip"
  },
  "files": [...]
}
```

3. Test locally:

```bash
chmod +x fonts/active/my-font/fetch.sh
./fonts/active/my-font/fetch.sh
npm run validate
npm run build
```

## Updating Fonts

### Manual update

```bash
./fonts/active/my-font/fetch.sh 1.2.0
npm run validate && npm run build
git add . && git commit -m "chore: update my-font to 1.2.0"
```

### Automatic updates

GitHub Actions runs weekly to check for updates:

```yaml
# .github/workflows/update.yml
schedule:
  - cron: '0 0 * * 1'  # Every Monday
```

Manual trigger:

```bash
gh workflow run update.yml -f fonts="sarasa-mono-sc smiley-sans"
```

## Deprecating a Font

```bash
mv fonts/active/my-font fonts/deprecated/
```

Update `font.json`:

```json
{
  ...
  "deprecated": true,
  "deprecatedReason": "Font is no longer maintained upstream",
  "deprecatedDate": "2026-07-01",
  "replacement": "new-font-id"
}
```

```bash
git add fonts/deprecated/my-font
git commit -m "feat: deprecate my-font"
git push
```

## Directory Structure

```
fonts-cdn/
├── fonts/
│   ├── active/
│   │   └── {font-id}/
│   │       ├── font.json    # Metadata
│   │       ├── fetch.sh     # Download script (optional)
│   │       └── *.woff2      # Font files
│   └── deprecated/
├── scripts/
│   ├── validate.mjs
│   ├── build.mjs
│   └── fetch-all.sh        # Update all fonts
├── dist/                   # Generated (gitignore)
└── .github/workflows/
    ├── validate.yml        # PR validation
    ├── release.yml        # Create releases
    ├── update.yml          # Auto-update fonts
    └── deprecate.yml       # Handle deprecation
```

## Allowed Licenses

- `OFL-1.0`, `OFL-1.1`
- `Apache-2.0`, `MIT`
- `BSD-2-Clause`, `BSD-3-Clause`
- `CC0-1.0`
- `Ubuntu-font-1.0`

Others require manual verification.

## License

MIT for build scripts.

Each font has its own license - see individual `font.json` files.
