import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const fontsDir = join(root, 'fonts');

const WEIGHT_NAMES = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

function getGitHubInfo() {
  try {
    const remote = execSync('git remote get-url origin', { cwd: root, encoding: 'utf-8' }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/\s.]+?)(?:\.git)?$/);
    if (match) return { user: match[1], repo: match[2] };
  } catch {}
  return { user: 'USER', repo: 'fonts-cdn' };
}

const { user, repo } = getGitHubInfo();
const CDN_BASE = `https://cdn.jsdelivr.net/gh/${user}/${repo}`;

function generateFontFace(fontName, face, fontId, tag) {
  return `@font-face {
  font-family: '${fontName}';
  src: url('${CDN_BASE}@${tag}/fonts/${fontId}/${face.src}') format('woff2');
  font-weight: ${face.font_weight};
  font-style: ${face.font_style};
  font-display: swap;
}`;
}

function findScoopManifests(fontDir) {
  const manifests = [];
  for (const entry of readdirSync(fontDir)) {
    if (entry.endsWith('.meta.json')) continue;
    if (entry.endsWith('.json')) manifests.push(join(fontDir, entry));
  }
  return manifests;
}

function scanFonts(dir, fontIds) {
  const fonts = [];
  if (!existsSync(dir)) return fonts;

  for (const fontId of readdirSync(dir)) {
    if (fontIds && !fontIds.includes(fontId)) continue;
    const fontDir = join(dir, fontId);
    if (!statSync(fontDir).isDirectory()) continue;

    const scoopPaths = findScoopManifests(fontDir);
    if (scoopPaths.length === 0) continue;

    const scoops = scoopPaths.map(p => JSON.parse(readFileSync(p, 'utf-8')));
    const primaryScoop = scoops[0];

    const metaFiles = readdirSync(fontDir).filter(f => f.endsWith('.meta.json'));
    for (const metaFile of metaFiles) {
      const meta = JSON.parse(readFileSync(join(fontDir, metaFile), 'utf-8'));

      fonts.push({
        fontId,
        cssId: metaFile.replace('.meta.json', ''),
        font_name: meta.font_name || fontId,
        deprecated: meta.deprecated || false,
        version: primaryScoop.version,
        tag: `${fontId}@${primaryScoop.version}`,
        homepage: primaryScoop.homepage || '',
        font_face: (meta.font_face || []).map(f => ({ ...f, fontId })),
      });
    }
  }
  return fonts;
}

function faceFilename(face, usedNames) {
  const slug = (face.src || '').replace('.woff2', '').toLowerCase();
  let name = slug + '.css';
  if (usedNames.has(name)) {
    let idx = 2;
    while (usedNames.has(slug + `-${idx}.css`)) idx++;
    name = slug + `-${idx}.css`;
  }
  usedNames.add(name);
  return name;
}

function main(fontIds) {
  console.log('Building...\n');

  const fonts = scanFonts(fontsDir, fontIds);
  const activeFonts = fonts.filter(f => !f.deprecated);

  const cssDir = join(root, 'css');
  mkdirSync(cssDir, { recursive: true });

  for (const font of activeFonts) {
    const css = font.font_face
      .map(f => generateFontFace(font.font_name, f, font.fontId, font.tag))
      .join('\n\n');
    writeFileSync(join(cssDir, `${font.cssId}.css`), css);
    console.log(`Generated: css/${font.cssId}.css`);

    if (font.font_face.length > 1) {
      const fontCssDir = join(cssDir, font.cssId);
      mkdirSync(fontCssDir, { recursive: true });
      const usedNames = new Set();
      for (const face of font.font_face) {
        const singleCss = generateFontFace(font.font_name, face, font.fontId, font.tag);
        const filename = faceFilename(face, usedNames);
        writeFileSync(join(fontCssDir, filename), singleCss);
      }
      console.log(`Generated: css/${font.cssId}/*.css (${font.font_face.length} files)`);
    }
  }

  console.log(`\n✓ Built ${activeFonts.length} font families`);

  let fontsJson;
  const fontsJsonPath = join(root, 'fonts.json');
  const newEntries = activeFonts.map(f => ({
    cssId: f.cssId,
    version: f.version,
    homepage: f.homepage,
  }));

  if (existsSync(fontsJsonPath)) {
    const existing = JSON.parse(readFileSync(fontsJsonPath, 'utf-8'));
    const mergedMap = new Map();
    for (const entry of existing) mergedMap.set(entry.cssId, entry);
    for (const entry of newEntries) mergedMap.set(entry.cssId, entry);
    fontsJson = [...mergedMap.values()];
  } else {
    fontsJson = newEntries;
  }
  writeFileSync(fontsJsonPath, JSON.stringify(fontsJson, null, 2) + '\n');
}

const fontIds = process.argv.slice(2);
if (fontIds.length === 0) {
  main(null);
} else {
  main(fontIds);
}
