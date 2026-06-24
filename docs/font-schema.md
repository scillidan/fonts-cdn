# font.json Schema

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | URL-safe identifier (kebab-case: `my-font`) |
| `name` | string | Display name |
| `version` | string | Upstream version (semver: `1.0.0`) |
| `license` | object | `{ spdx: "OFL-1.1", url: "https://..." }` |
| `source` | object | `{ url: "https://...", type: "github" }` |
| `files` | array | Font file definitions |

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `nameLocal` | string | Native language name |
| `description` | string | Brief description (max 200 chars) |
| `category` | string | `serif`, `sans-serif`, `monospace`, `display`, `handwriting`, `cjk` |
| `subsets` | array | Character subsets: `latin`, `hanzi-simplified`, etc. |
| `fetch` | object | Fetch script config |
| `added` | string | Date added: `2026-06-23` |
| `maintainer` | string | GitHub username |

## files Array

Each entry:
```json
{
  "filename": "MyFont-Regular.woff2",
  "weight": 400,
  "style": "normal",
  "displayName": "Regular"
}
```

| Field | Type | Values |
|-------|------|--------|
| `filename` | string | Must match actual file |
| `weight` | integer | 100-900 (multiple of 100) |
| `style` | string | `normal`, `italic`, `oblique` |
| `displayName` | string | Optional: `Bold`, `Light`, etc. |

## fetch Object

For auto-updating fonts:

```json
{
  "script": "fetch.sh",
  "upstreamRepo": "owner/repo",
  "assetPattern": "FontName-TTF-{version}.7z",
  "notes": "Uses 7z format"
}
```

## Full Example

```json
{
  "$schema": "../../../font.schema.json",
  "id": "sarasa-mono-sc",
  "name": "Sarasa Mono SC",
  "nameLocal": "更纱等距黑体 SC",
  "description": "Monospace CJK font with simplified Chinese",
  "category": "monospace",
  "version": "1.0.39",
  "license": {
    "spdx": "OFL-1.1",
    "url": "https://github.com/be5invis/Sarasa-Gothic/blob/main/LICENSE"
  },
  "source": {
    "url": "https://github.com/be5invis/Sarasa-Gothic",
    "type": "github"
  },
  "fetch": {
    "script": "fetch.sh",
    "upstreamRepo": "be5invis/Sarasa-Gothic",
    "assetPattern": "SarasaMonoSC-TTF-{version}.7z"
  },
  "files": [
    { "filename": "SarasaMonoSC-Regular.woff2", "weight": 400, "style": "normal" },
    { "filename": "SarasaMonoSC-Bold.woff2", "weight": 700, "style": "normal" }
  ],
  "subsets": ["latin", "hanzi-simplified"],
  "added": "2026-06-23",
  "maintainer": "scillidan"
}
```

## Deprecated Fields

When deprecating a font:

```json
{
  ...
  "deprecated": true,
  "deprecatedReason": "Font discontinued upstream",
  "deprecatedDate": "2026-07-01",
  "replacement": "new-font-id"
}
```

## Validation

Run: `npm run validate`

Checks:
- JSON schema compliance
- Font files exist
- License in whitelist
- File size warnings (>5MB)