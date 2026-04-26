# Lulio

**Aprende catalán desde el español, jugando.** A free, login-free, fully static web app for Spanish speakers learning Catalan.

[Live site](#) once GitHub Pages is enabled (see below).

## Features

- 5 progressive blocks (CEFR A1 → B2+) with multi-topic lessons.
- Side-by-side Spanish ↔ Catalan content that surfaces the *contrasts* between the two languages.
- Bilingual UI (ES / CA toggle).
- Pronunciation via the browser's built-in Catalan TTS.
- Anonymous: no accounts. Progress saves in browser cookies.
- 100% static. Hosted on GitHub Pages with no build step, no backend.

## Run locally

```bash
python3 -m http.server 8765
# open http://localhost:8765/
```

That's all. There is no install step.

## Deploy on GitHub Pages

1. Push to `main`.
2. In the repo's **Settings → Pages**, set:
   - Source: *Deploy from a branch*
   - Branch: `main`
   - Folder: `/ (root)`
3. The site appears at `https://<owner>.github.io/<repo>/`.

The repo includes a `.nojekyll` file so Pages serves all files verbatim.

## Tech

- HTML + CSS + ES-module JavaScript. No framework, no bundler, no npm.
- Libraries from CDN: [`canvas-confetti`](https://github.com/catdad/canvas-confetti), [`js-cookie`](https://github.com/js-cookie/js-cookie).
- Built-in browser APIs: Web Speech (TTS), View Transitions.
- Lesson content as small JSON files under `content/lessons/`.

## Adding content

See `CLAUDE.md` for the full schema and editing flow. TL;DR:

1. Set `placeholder: false` on the lesson entry in `content/index.json`.
2. Drop a new file at `content/lessons/<block>-<lesson>.json`.
3. Reload locally — done.

## Project layout

```
index.html  · CLAUDE.md · README.md · .nojekyll
css/        · main.css, theme.css
js/         · app.js, router.js, state.js, i18n.js, tts.js, content.js, exercises.js, views/
content/    · index.json, lessons/<block>-<lesson>.json
assets/     · logo.svg
```

## Changelog

- **v0.1.0** — Initial release. Block 1 fully authored (5 lessons), Block 2 lesson 1 authored. Blocks 2–5 remaining lessons stubbed as "Properament".

## License

MIT.
