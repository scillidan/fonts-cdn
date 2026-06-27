# Contributing

## Adding a Font

### 1. Create directory

```bash
mkdir fonts/my-font
```

### 2. Add font.json

See [docs/font-schema.md](docs/font-schema.md) for full schema.

Minimal example:
```json
{
  "$schema": "../../font.schema.json",
  "id": "my-font",
  "name": "My Font",
  "version": "1.0.0",
  "license": { "spdx": "OFL-1.1", "url": "https://..." },
  "source": { "url": "https://github.com/example/my-font", "type": "github" },
  "files": [
    { "filename": "MyFont-Regular.woff2", "weight": 400, "style": "normal" }
  ]
}
```

### 3. Add fetch.sh (optional, for auto-update)

For GitHub-released fonts:
```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION="${1:-}"

if [ -z "$VERSION" ]; then
    VERSION=$(curl -sL https://api.github.com/repos/OWNER/REPO/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')
fi

DOWNLOAD_URL="https://github.com/OWNER/REPO/releases/download/v${VERSION}/ASSET-${VERSION}.7z"
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

curl -sL -o "$TEMP_DIR/font.7z" "$DOWNLOAD_URL"
7z x -o"$TEMP_DIR/extracted" "$TEMP_DIR/font.7z"

for ttf in "$TEMP_DIR/extracted"/*.ttf; do
    woff2_compress "$ttf"
done

mv "$TEMP_DIR/extracted"/*.woff2 "$SCRIPT_DIR/"

if [ -f "$SCRIPT_DIR/font.json" ] && command -v jq &>/dev/null; then
    tmp=$(mktemp)
    jq ".version = \"$VERSION\"" "$SCRIPT_DIR/font.json" > "$tmp"
    mv "$tmp" "$SCRIPT_DIR/font.json"
fi
```

### 4. Test locally

```bash
chmod +x fonts/my-font/fetch.sh
./fonts/my-font/fetch.sh
npm run validate
npm run build
npm run dev  # Open http://localhost:3000/dist/
```

### 5. Push

```bash
git add fonts/my-font
git commit -m "feat: add my-font"
git push
```

GitHub Actions will:
- Validate and build
- Create release: `my-font@1.0.0`

## Updating Fonts

### Manual
```bash
./fonts/my-font/fetch.sh 1.2.0
npm run validate && npm run build
git add . && git commit -m "chore: update my-font to 1.2.0"
git push
```

### Automatic
Weekly check via GitHub Actions. Or trigger manually:
```bash
gh workflow run update.yml -f fonts="my-font"
```

## Deprecating a Font

Update `fonts/my-font/font.json`:
```json
{
  ...
  "deprecated": true,
  "deprecatedReason": "Replaced by new-font",
  "deprecatedDate": "2026-07-01",
  "replacement": "new-font-id"
}
```

```bash
git add fonts/my-font/font.json
git commit -m "feat: deprecate my-font"
git push
```

Then run the **Deprecate Font** workflow (Actions → Deprecate Font → Run workflow) with the font ID to clean up releases.

## Allowed Licenses

- `OFL-1.0`, `OFL-1.1`
- `Apache-2.0`, `MIT`
- `BSD-2-Clause`, `BSD-3-Clause`
- `CC0-1.0`
- `Ubuntu-font-1.0`

Others require manual verification in workflow.

## File Naming

- Font files: `{FontName}-{Weight}{Style}.woff2`
  - `MyFont-Regular.woff2`
  - `MyFont-BoldItalic.woff2`
- Directory: `my-font` (kebab-case)
