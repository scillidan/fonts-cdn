#!/bin/bash
set -euo pipefail

# scripts/fetch-all.sh
# Fetch all fonts that need updating
# Usage: ./scripts/fetch-all.sh [--dry-run] [font-id...]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
FONTS_DIR="$ROOT_DIR/fonts/active"

DRY_RUN=false
SPECIFIC_FONTS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true; shift ;;
        *) SPECIFIC_FONDS+=("$1"); shift ;;
    esac
done

# Function to fetch a font
fetch_font() {
    local font_dir="$1"
    local font_id=$(basename "$font_dir")
    local font_json="$font_dir/font.json"
    local fetch_script="$font_dir/fetch.sh"
    
    if [ ! -f "$font_json" ]; then
        echo "[$font_id] Skip: no font.json"
        return 0
    fi
    
    # Check if fetch script exists
    if [ ! -f "$fetch_script" ]; then
        echo "[$font_id] Skip: no fetch.sh"
        return 0
    fi
    
    # Get current version from font.json
    local current_version=""
    if command -v jq &>/dev/null; then
        current_version=$(jq -r '.version' "$font_json" 2>/dev/null || echo "")
    fi
    
    echo "[$font_id] Fetching... (current: ${current_version:-unknown})"
    
    if [ "$DRY_RUN" = true ]; then
        echo "[$font_id] DRY RUN: would execute $fetch_script"
        return 0
    fi
    
    # Execute fetch script
    cd "$font_dir"
    if bash fetch.sh; then
        echo "[$font_id] ✓ Fetched successfully"
    else
        echo "[$font_id] ✗ Fetch failed (continuing)"
    fi
    cd "$ROOT_DIR"
}

# Main
echo "=== Fetching fonts ==="
echo ""

if [ ${#SPECIFIC_FONTS[@]} -gt 0 ]; then
    for font_id in "${SPECIFIC_FONTS[@]}"; do
        fetch_font "$FONTS_DIR/$font_id"
    done
else
    for font_dir in "$FONTS_DIR"/*/; do
        if [ -d "$font_dir" ]; then
            fetch_font "$font_dir"
        fi
    done
fi

echo ""
echo "=== Done ==="
