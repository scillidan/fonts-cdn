# [fonts-cdn](https://github.com/scillidan/fonts-cdn)

Webfont CDN powered by GitHub Action (`windows-latest` + `scoop`) and jsDelivr.

Authors: GLM-5.1🧙‍♂️, DeepSeek-V4🤡, scillidan🤡

## Usage

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/{user}/{repo}@{font-id}@main/css/{font-id}.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/{user}/{repo}@{font-id}@{version}/css/{font-id}.css">
```

For example:

```html
<!-- The latest version -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/scillidan/fonts@main/css/sarasa-mono-sc.css">
<!-- The custom version -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/scillidan/fonts@sarasa-mono-sc@1.0.40/css/sarasa-mono-sc.css">
<!-- The custom font -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/scillidan/fonts@sarasa-mono-sc@1.0.40/css/sarasa-mono-sc/sarasa-mono-sc.css">
```

See more on [scillidan/fonts](https://github.com/scillidan/fonts).

## Start

1. **Use this template**
2. **Clone** your repo to local
3. **Add font** → `fonts/{font-id}/{Font-Name}.json`
	- Fetch and verify font files using [Scoop's app manifest](https://github.com/ScoopInstaller/Scoop/wiki/App-Manifests)
	- The `.ttf` files and the font licenses are required
4. **Push**
5. **Build** → Actions → Release → Run workflow → `{font-id}`
6. **Preview** → Your repo → Settings → Pages → Source → `GitHub Actions`
	- Visit the Github Pages website
	- If you add new fonts, you need to modify `index.html`

## Related projects

- [Fontsource](https://github.com/fontsource/fontsource)
- [xz/fonts](https://github.com/xz/fonts)

## Attribute

Each font has its own license. Others is under `MIT`.