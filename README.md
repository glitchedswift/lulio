# Lulio

**Aprende català desde el español, jugando.** A free, login-free, fully static web app for Spanish speakers learning Catalan.

[Live site](#) once GitHub Pages is enabled (see below).

## Features

- 5 progressive blocks (CEFR A1 → B2+) with multi-topic lessons.
- Side-by-side Spanish ↔ Catalan content that surfaces the *contrasts* between the two languages.
- **Pattern-based learning**: dedicated lesson type teaches morphological rules (e.g. -ción → -ció, -dad → -tat, ie → e) so learners can *deduce* vocabulary instead of memorising lists.
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

## Exercise types

Six exercise types: `flashcard`, `compare`, `multiple_choice`, `translate` (word-bank), `listen` (TTS pick), `fill_blank`. Plus a seventh:

- **`pattern`** — shows a linguistic rule (e.g. `-ción → -ció`) with a grid of clickable word-pair examples (each plays TTS). Always auto-accepted; meant to precede graded exercises on the same rule.

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

- **v0.3.0** — New `pattern` exercise type with visual rule cards and TTS word-pair examples. New lesson 1-6 "Patrons lingüístics" (4 topics + 1 extra) covering -ción→-ció, -dad→-tat, -mente→-ment, and diphthong reduction ie→e / ue→o. Home screen "Basado en patrones" card now shows a concrete example. Terminology: "catalán" replaced by "català" throughout Spanish-language UI strings.
- **v0.2.0** — Full lesson content for Blocks 1–5 (28 lessons, placeholders for unfinished ones).
- **v0.1.0** — Initial release. Block 1 fully authored (5 lessons), Block 2 lesson 1 authored. Blocks 2–5 remaining lessons stubbed as "Properament".

## License

MIT.
