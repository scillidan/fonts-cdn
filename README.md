# fonts-cdn

Self-hosted webfont CDN via GitHub + jsDelivr. Ideal for CJK and niche fonts.

## Usage

```html
<link rel="stylesheet" 
      href="https://cdn.jsdelivr.net/gh/USER/fonts-cdn@FONT-ID@VERSION/dist/css/FONT-ID.css">

<style>
  body { font-family: 'Sarasa Mono SC', monospace; }
</style>
```

**Example:**
```html
<link rel="stylesheet" 
      href="https://cdn.jsdelivr.net/gh/scillidan/fonts-cdn@sarasa-mono-sc@1.0.39/dist/css/sarasa-mono-sc.css">
```

## Quick Start

1. **Use this template** → Create new repository
2. **Clone** your repo
3. **Add font** → `fonts/active/my-font/font.json`
4. **Push** → Auto-builds and releases

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Features

- woff2 format
- Per-font version locking
- Automated updates via fetch scripts
- License validation

## Structure

```
fonts/active/{font-id}/
├── font.json    # Metadata
├── fetch.sh     # Download script (optional)
└── *.woff2      # Font files (fetched, not committed)
```

## License

MIT for scripts. Each font has its own license.

---

See [CONTRIBUTING.md](CONTRIBUTING.md) for adding fonts, updates, and deprecation.