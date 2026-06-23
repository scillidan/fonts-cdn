#!/bin/bash
set -euo pipefail

# fonts/active/sarasa-mono-sc/fetch.sh
# Download Sarasa Mono SC from upstream GitHub releases

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION="${1:-}"

# If no version specified, get latest from API
if [ -z "$VERSION" ]; then
    echo "Fetching latest version..."
    VERSION=$(curl -sL https://api.github.com/repos/be5invis/Sarasa-Gothic/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')
    echo "Latest version: $VERSION"
fi

DOWNLOAD_URL="https://github.com/be5invis/Sarasa-Gothic/releases/download/v${VERSION}/SarasaMonoSC-TTF-${VERSION}.7z"
TEMP_DIR=$(mktemp -d)
ARCHIVE_FILE="$TEMP_DIR/SarasaMonoSC-TTF-${VERSION}.7z"

trap "rm -rf $TEMP_DIR" EXIT

echo "Downloading Sarasa Mono SC v${VERSION}..."
curl -sL -o "$ARCHIVE_FILE" "$DOWNLOAD_URL"

echo "Extracting..."
7z x -o"$TEMP_DIR/extracted" "$ARCHIVE_FILE" >/dev/null || \
bsdtar -xf "$ARCHIVE_FILE" -C "$TEMP_DIR/extracted" 2>/dev/null || \
{ echo "Error: Need 7z or bsdtar to extract .7z files"; exit 1; }

echo "Converting to woff2..."
for ttf in "$TEMP_DIR/extracted"/*.ttf; do
    filename=$(basename "$ttf" .ttf)
    woff2_compress "$ttf" 2>/dev/null || \
    { echo "Error: No woff2 converter available. Install woff2."; exit 1; }
done

echo "Moving to font directory..."
mv "$TEMP_DIR/extracted"/*.woff2 "$SCRIPT_DIR/"

echo "Done: $(ls "$SCRIPT_DIR"/*.woff2 2>/dev/null | wc -l) woff2 files"

# Update font.json version if exists
FONT_JSON="$SCRIPT_DIR/font.json"
if [ -f "$FONT_JSON" ]; then
    if command -v jq &>/dev/null; then
        tmp=$(mktemp)
        jq ".version = \"$VERSION\"" "$FONT_JSON" > "$tmp" && mv "$tmp" "$FONT_JSON"
        echo "Updated font.json version to $VERSION"
    fi
fi
