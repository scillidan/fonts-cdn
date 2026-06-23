import Ajv from 'ajv';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const activeDir = join(root, 'fonts', 'active');
const deprecatedDir = join(root, 'fonts', 'deprecated');

const ajv = new Ajv({ allErrors: true, strict: false });
const schema = JSON.parse(readFileSync(join(root, 'font.schema.json'), 'utf-8'));
delete schema['$schema'];
const validate = ajv.compile(schema);

const errors = [];
const warnings = [];
const fonts = [];

const allowedLicenses = [
  'OFL-1.0', 'OFL-1.1',
  'Apache-2.0',
  'MIT',
  'BSD-2-Clause', 'BSD-3-Clause',
  'CC0-1.0',
  'Ubuntu-font-1.0'
];

function validateFont(fontDir, isDeprecated = false) {
  const fontJsonPath = join(fontDir, 'font.json');
  
  if (!existsSync(fontJsonPath)) {
    errors.push(`${fontDir}: Missing font.json`);
    return null;
  }
  
  let font;
  try {
    font = JSON.parse(readFileSync(fontJsonPath, 'utf-8'));
  } catch (e) {
    errors.push(`${fontDir}: Invalid JSON - ${e.message}`);
    return null;
  }
  
  if (!validate(font)) {
    for (const err of validate.errors) {
      errors.push(`${font.id || fontDir}: ${err.instancePath} ${err.message}`);
    }
    return null;
  }
  
  if (isDeprecated && !font.deprecated) {
    errors.push(`${font.id}: Font in deprecated/ must have deprecated=true`);
    return null;
  }
  
  for (const file of font.files) {
    const filePath = join(fontDir, file.filename);
    if (!existsSync(filePath)) {
      errors.push(`${font.id}: Missing file ${file.filename}`);
    } else {
      const stat = statSync(filePath);
      if (stat.size > 5 * 1024 * 1024) {
        warnings.push(`${font.id}: ${file.filename} is ${(stat.size / 1024 / 1024).toFixed(2)}MB (>5MB)`);
      }
    }
  }
  
  if (!allowedLicenses.includes(font.license.spdx)) {
    warnings.push(`${font.id}: License '${font.license.spdx}' not in whitelist. Verify redistribution is permitted.`);
  }
  
  return font;
}

function main() {
  console.log('Validating fonts...\n');
  
  if (existsSync(activeDir)) {
    for (const fontId of readdirSync(activeDir)) {
      const fontDir = join(activeDir, fontId);
      if (statSync(fontDir).isDirectory()) {
        const font = validateFont(fontDir, false);
        if (font) fonts.push({ ...font, status: 'active' });
      }
    }
  }
  
  if (existsSync(deprecatedDir)) {
    for (const fontId of readdirSync(deprecatedDir)) {
      const fontDir = join(deprecatedDir, fontId);
      if (statSync(fontDir).isDirectory()) {
        const font = validateFont(fontDir, true);
        if (font) fonts.push({ ...font, status: 'deprecated' });
      }
    }
  }
  
  if (warnings.length > 0) {
    console.log('Warnings:');
    for (const w of warnings) console.log(`  ⚠ ${w}`);
    console.log();
  }
  
  if (errors.length > 0) {
    console.log('Errors:');
    for (const e of errors) console.log(`  ✗ ${e}`);
    process.exit(1);
  }
  
  console.log(`✓ Validation passed\n`);
  console.log(`Active: ${fonts.filter(f => f.status === 'active').length}`);
  console.log(`Deprecated: ${fonts.filter(f => f.status === 'deprecated').length}`);
  console.log();
  
  for (const font of fonts) {
    const status = font.status === 'deprecated' ? ' [DEPRECATED]' : '';
    console.log(`  ${font.id}@${font.version}${status}`);
  }
}

main();
