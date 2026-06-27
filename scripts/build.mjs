import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const fontsDir = join(root, 'fonts');
const distDir = join(root, 'dist');

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/USER/fonts-cdn';

function generateFontFace(font, file) {
  return `@font-face {
  font-family: '${font.name}';
  src: url('${CDN_BASE}@${font.id}@${font.version}/fonts/${font.id}/${file.filename}') format('woff2');
  font-weight: ${file.weight};
  font-style: ${file.style};
  font-display: swap;
}`;
}

function generateFontCss(font) {
  return font.files.map(f => generateFontFace(font, f)).join('\n\n');
}

function generateDemo(fonts) {
  const activeFonts = fonts.filter(f => !f.deprecated);

  const fontCards = activeFonts.map(font => {
    const weights = [...new Set(font.files.map(f => f.weight))].sort((a, b) => a - b);
    const previews = weights.map(w => {
      const normalFile = font.files.find(f => f.weight === w && f.style === 'normal');
      const italicFile = font.files.find(f => f.weight === w && f.style === 'italic');
      const lines = [];

      if (normalFile) {
        lines.push(`<span style="font-family: '${font.name}'; font-weight: ${w};">${font.nameLocal || font.name} ${w}</span>`);
      }
      if (italicFile) {
        lines.push(`<span style="font-family: '${font.name}'; font-weight: ${w}; font-style: italic;">${font.nameLocal || font.name} ${w} Italic</span>`);
      }
      return lines.join('<br>\n          ');
    }).join('<br>\n          ');

    return `
    <div class="font-card">
      <h2>${font.name}</h2>
      <p class="desc">${font.description || ''}</p>
      <div class="preview">${previews}</div>
      <div class="meta">
        <a href="${font.source.url}">Source</a>
        <span>License: <a href="${font.license.url}">${font.license.spdx}</a></span>
        <span>Version: ${font.version}</span>
      </div>
      <code>&lt;link rel="stylesheet" href="${CDN_BASE}@${font.id}@${font.version}/dist/css/${font.id}.css"&gt;</code>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Font Catalog</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css">
  <link rel="stylesheet" href="css/bundle.css">
  <style>
    .font-card { margin: 2rem 0; padding: 1rem; border: 1px solid var(--nc-lk-2); }
    .font-card h2 { margin-top: 0; }
    .preview { margin: 1rem 0; font-size: 1.25rem; }
    .desc { opacity: 0.7; }
    .meta { font-size: 0.85rem; opacity: 0.7; }
    .meta > * { margin-right: 1rem; }
    code { display: block; margin-top: 0.5rem; padding: 0.5rem; background: var(--nc-lk-1); color: white; overflow-x: auto; }
  </style>
</head>
<body>
  <header>
    <h1>Font Catalog</h1>
    <p><a href="https://github.com/USER/fonts-cdn">GitHub</a></p>
  </header>
  <main>${fontCards}
  </main>
</body>
</html>`;
}

function scanFonts(dir, fonts) {
  if (!existsSync(dir)) return;
  for (const fontId of readdirSync(dir)) {
    const fontDir = join(dir, fontId);
    if (!statSync(fontDir).isDirectory()) continue;
    const fontJsonPath = join(fontDir, 'font.json');
    if (!existsSync(fontJsonPath)) continue;
    const font = JSON.parse(readFileSync(fontJsonPath, 'utf-8'));
    fonts.push(font);
  }
}

function main() {
  console.log('Building...\n');

  const fonts = [];
  scanFonts(fontsDir, fonts);

  const cssDir = join(distDir, 'css');
  mkdirSync(cssDir, { recursive: true });

  const activeFonts = fonts.filter(f => !f.deprecated);
  const bundle = [];

  for (const font of activeFonts) {
    const css = generateFontCss(font);
    writeFileSync(join(cssDir, `${font.id}.css`), css);
    bundle.push(css);
    console.log(`Generated: dist/css/${font.id}.css`);
  }

  writeFileSync(join(cssDir, 'bundle.css'), bundle.join('\n\n'));
  console.log('Generated: dist/css/bundle.css');

  const html = generateDemo(fonts);
  writeFileSync(join(distDir, 'index.html'), html);
  console.log('Generated: dist/index.html');

  console.log(`\n✓ Built ${activeFonts.length} fonts`);
}

main();
