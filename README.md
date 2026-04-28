# Lulio

**Aprende català des del castellà.** Free, login-free, fully static web app for Spanish speakers learning Catalan.

## Run locally

```bash
python3 -m http.server 8765
# open http://localhost:8765/
```

No install step. No build step.

## Deploy

1. Push to `main`.
2. **Settings → Pages** → source: `main` / `/ (root)`.
3. Site appears at `https://<owner>.github.io/<repo>/`.

A `.nojekyll` file is included so Pages serves all files verbatim.

## Tech

Vanilla HTML + CSS + ES-module JS. No framework, no bundler, no npm.

- CDN libs: [`canvas-confetti`](https://github.com/catdad/canvas-confetti), [`js-cookie`](https://github.com/js-cookie/js-cookie)
- Browser APIs: Web Speech (Catalan TTS), View Transitions
- Progress stored in three `SameSite=Lax` cookies (no backend)

## Content

5 blocks (A1 → B2+), each with 6–8 lessons. Each lesson has up to 4 required topics and up to 2 optional extras. Lessons are JSON files under `content/lessons/`.

**Blocks:**

| # | Level | Theme |
|---|---|---|
| 1 | A1 | Greetings, sounds, numbers, articles, false friends, patterns |
| 2 | A1+/A2 | Family, home, food, routine, time, possessives |
| 3 | A2/B1 | City navigation, transport, shopping, tenses, pronouns hi/en |
| 4 | B1/B2 | Work, opinions, emotions, health, future/conditional, negation |
| 5 | B2+ | Traditions, idioms, formal register, written language, discourse |

**Exercise types:** `flashcard`, `compare`, `pattern`, `multiple_choice`, `translate`, `fill_blank`, `listen`

The `pattern` type is the core of Lulio's pedagogy: it surfaces a morphological rule (e.g. `-ción → -ció`, `ie → e`) before the learner hits graded exercises, so they can deduce vocabulary instead of memorising lists.

## Adding a lesson

1. Flip `placeholder: false` on the entry in `content/index.json`.
2. Create `content/lessons/<block>-<lesson>.json`.
3. Reload — done.

Full schema and conventions in `CLAUDE.md`.

## Project layout

```
/
├── index.html              # SPA shell
├── .nojekyll
├── CLAUDE.md               # Canonical dev guide (schema, conventions, rules)
├── css/
│   ├── theme.css           # CSS custom properties
│   └── main.css            # Layout, components, animations
├── js/
│   ├── app.js              # Bootstrap, routing, topbar
│   ├── router.js           # Hash router
│   ├── state.js            # Cookie-backed state
│   ├── i18n.js             # UI strings (ES/CA)
│   ├── tts.js              # Web Speech wrapper
│   ├── content.js          # JSON fetch + cache
│   ├── exercises.js        # Exercise renderer + check API
│   └── views/
│       ├── home.js
│       ├── roadmap.js
│       └── lesson.js
├── content/
│   ├── index.json          # Block/lesson manifest
│   └── lessons/            # <block>-<lesson>.json
└── assets/
    └── logo.svg
```

## License

MIT.
