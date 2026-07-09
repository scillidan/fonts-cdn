import { readFileSync, writeFileSync, readdirSync, existsSync, renameSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import ttf2woff2 from 'ttf2woff2';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WEIGHT_MODIFIERS = new Set([
  'Thin', 'ExtraLight', 'XLight', 'Light', 'Regular', 'Medium',
  'SemiBold', 'Bold', 'ExtraBold', 'Black', 'Heavy',
]);

const STYLE_MODIFIERS = new Set([
  'Italic', 'Oblique',
]);

function stripOverridableModifiers(family, weightLabel, fontStyle) {
  const words = family.split(/\s+/);
  const filtered = words.filter(w => {
    if (WEIGHT_MODIFIERS.has(w)) {
      if (w === 'Regular' && fontStyle === 'italic') return true;
      return false;
    }
    if (STYLE_MODIFIERS.has(w)) return false;
    return true;
  });
  const result = filtered.join(' ');
  return result || family;
}

const pyScriptPath = join(__dirname, '_read_ttf_info.py');

function readTtfInfo(ttfPath) {
  const result = execSync(`python "${pyScriptPath}" "${ttfPath}"`, { encoding: 'utf-8' }).trim();
  const lines = result.split('\n').map(s => s.trim());
  return {
    fullName: lines[0],
    family: lines[1],
    subfamily: lines[2],
    weightStr: lines[3],
    weight: parseInt(lines[3]),
    fontStyle: lines[4],
    weightLabel: lines[5] || '',
  };
}

function normalizeTtfName(fontId, fullName, usedNames) {
  const slug = fullName.toLowerCase().replace(/\s+/g, '-');
  let name = slug + '.woff2';
  if (usedNames.has(name)) {
    let idx = 2;
    while (usedNames.has(slug + `-${idx}.woff2`)) idx++;
    name = slug + `-${idx}.woff2`;
  }
  usedNames.add(name);
  const ttfName = name.replace('.woff2', '.ttf');
  return { ttfName, woff2Name: name };
}

function processFont(fontDir) {
  const ttfFiles = readdirSync(fontDir).filter(f => f.endsWith('.ttf') && !f.startsWith('.'));

  if (ttfFiles.length === 0) {
    console.log(`  No ttf files found`);
    return;
  }

  const fontId = fontDir.split('\\').pop().split('/').pop();
  const usedNames = new Set();
  const allFaces = [];

  console.log(`  fonttools detected:`);
  for (const ttfFile of ttfFiles) {
    const info = readTtfInfo(join(fontDir, ttfFile));
    const names = normalizeTtfName(fontId, info.fullName, usedNames);
    console.log(`    ${ttfFile} -> ${names.woff2Name} (fullName=${info.fullName}, family=${info.family}, subfamily=${info.subfamily}, weight=${info.weightStr}, fontStyle=${info.fontStyle})`);
    allFaces.push({ ttfFile, newName: names.ttfName, woff2Name: names.woff2Name, ...info });
  }

  for (const face of allFaces) {
    const ttfPath = join(fontDir, face.ttfFile);
    const newPath = join(fontDir, face.newName);
    const woff2Path = join(fontDir, face.woff2Name);

    const ttfContent = readFileSync(ttfPath);
    let woff2Content;
    try {
      woff2Content = ttf2woff2(ttfContent);
    } catch (e) {
      console.error(`  Convert failed for ${face.ttfFile}: ${e.message}`);
      continue;
    }

    if (face.ttfFile !== face.newName) {
      renameSync(ttfPath, newPath);
      console.log(`  Renamed: ${face.ttfFile} -> ${face.newName}`);
    }

    writeFileSync(woff2Path, woff2Content);
    console.log(`  Converted: ${face.newName} -> ${face.woff2Name}`);
  }

  const groups = {};
  for (const face of allFaces) {
    const key = stripOverridableModifiers(face.family, face.weightLabel, face.fontStyle);
    if (!groups[key]) groups[key] = [];
    groups[key].push(face);
  }

  const oldPatchPath = join(fontDir, 'meta.patch.json');
  if (existsSync(oldPatchPath)) unlinkSync(oldPatchPath);

  for (const [fontName, faces] of Object.entries(groups)) {
    const metaFileName = fontName.toLowerCase().replace(/\s+/g, '-') + '.meta.json';
    const metaPath = join(fontDir, metaFileName);

    const merged = {
      font_name: fontName,
      font_face: faces.map(f => ({
        src: f.woff2Name,
        font_weight: f.weight,
        font_style: f.fontStyle,
        font_family: stripOverridableModifiers(f.family, f.weightLabel, f.fontStyle),
        font_subfamily: f.subfamily,
      })),
    };

    writeFileSync(metaPath, JSON.stringify(merged, null, 2) + '\n');
    console.log(`  ${metaFileName}: font_name=${merged.font_name}, ${merged.font_face.length} faces`);
  }
}

const fontIds = process.argv.slice(2);

if (fontIds.length === 0) {
  console.error('Usage: node scripts/process.mjs <fontId...>');
  process.exit(1);
}

for (const fontId of fontIds) {
  const fontDir = join(process.cwd(), 'fonts', fontId);
  if (!existsSync(fontDir)) {
    console.error(`Font directory not found: ${fontDir}`);
    continue;
  }
  console.log(`Processing: ${fontId}`);
  processFont(fontDir);
}
