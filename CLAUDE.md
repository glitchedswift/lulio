# CLAUDE.md — Lulio operations guide

This document is the canonical brief for any LLM (or human) maintaining **Lulio**, a static web app that teaches Catalan to Spanish speakers. Read it before making changes.

---

## What Lulio is

- Audience: native or fluent **Spanish speakers** who want to learn **Catalan**.
- Pedagogy: lean on the high overlap between the two Romance languages and surface the *contrasts* (`ny` vs `ñ`, `els` vs `los`, periphrastic past, `hi`/`en`, gender shifts, false friends, etc.).
- Anonymous: no accounts, no backend. Progress is stored in **cookies** in the user's browser.
- 5 progressive blocks (CEFR-aligned, A1 → B2+). Each block has several lessons. Each lesson has up to 4 required topics and up to 2 optional **extras**.
- Built-in TTS (Web Speech API) for Catalan pronunciation.
- ES/CA UI toggle (lesson **content** is always bilingual; only chrome translates).

## Hosting model — DO NOT BREAK THIS

- **Pure static site** served by GitHub Pages from the repo root of `main`.
- **No build step**, **no bundler**, **no npm**, **no server**. The site is HTML + CSS + ES-module JS + JSON.
- All third-party libraries are loaded from public CDNs (jsDelivr). Don't vendor copies.
- Use **relative URLs** everywhere (e.g. `assets/logo.svg`, never `/assets/...`) so Pages project sites under `/<repo>/` work.
- A `.nojekyll` file is present so GitHub Pages serves files starting with `_` correctly. Keep it.

## Repo layout

```
/
├── index.html                # SPA shell (header, lang toggle, mount point)
├── .nojekyll
├── CLAUDE.md                 # This file
├── README.md                 # Human-facing intro + Pages setup
├── css/
│   ├── theme.css             # CSS custom properties (colors, type, radii)
│   └── main.css              # Layout, components, animations
├── js/
│   ├── app.js                # Bootstrap: loads state, defines routes, syncs topbar
│   ├── router.js             # Tiny hash router (#/, #/roadmap, #/lesson/:id)
│   ├── state.js              # Cookie-backed state (lang, progress, xp)
│   ├── i18n.js               # UI strings ES/CA + t()
│   ├── tts.js                # Web Speech wrapper, picks ca-ES voice
│   ├── content.js            # fetch + cache JSON content
│   ├── exercises.js          # Renderer + check API for the 6 exercise types
│   └── views/
│       ├── home.js           # Entry screen
│       ├── roadmap.js        # Snake-path map of blocks/lessons
│       └── lesson.js         # Lesson runner with progress + completion
├── content/
│   ├── index.json            # Manifest of blocks → lessons (with placeholder flags)
│   └── lessons/<block>-<lesson>.json
└── assets/
    └── logo.svg              # Lulio mascot
```

## Local development

```bash
cd lulio
python3 -m http.server 8765
# Open http://localhost:8765/
```

That's it. There is no install step.

## Deployment

1. Push to `main`.
2. In repo Settings → **Pages**, set source = `Deploy from a branch`, branch = `main`, folder = `/ (root)`.
3. The site appears at `https://<owner>.github.io/<repo>/`.

That's the entire deploy pipeline.

## State model

State is held in three cookies (`SameSite=Lax`, ~5y expiry):

| Cookie           | Type   | Shape |
|------------------|--------|-------|
| `lulio_lang`     | string | `"es"` or `"ca"` |
| `lulio_progress` | JSON   | `{ "<lessonId>": { "topicsCompleted": ["t1", …], "extrasCompleted": ["x1", …], "completedAt": "<ISO>" \| null } }` |
| `lulio_xp`       | string | total XP integer |

`js/state.js` is the single source of truth. Don't touch cookies elsewhere.

## Content schema

### `content/index.json` (manifest)

```jsonc
{
  "version": "0.1.0",
  "blocks": [
    {
      "id": 1,                       // block number, used in the lesson id and as color index
      "level": "A1",                  // free-form CEFR label
      "title":    { "es": "...", "ca": "..." },
      "subtitle": { "es": "...", "ca": "..." },
      "lessons": [
        {
          "id": 1,                    // lesson number within block; full id = "<block>-<lesson>"
          "title": { "es": "...", "ca": "..." },
          "icon": "👋",                // single emoji or short string for the roadmap node
          "topicCount": 3,             // total required topics; used for "complete" check on roadmap
          "placeholder": false         // true → renders "Properament" UI, no content file needed
        }
      ]
    }
  ]
}
```

- Block colors come from CSS variables `--block-1` … `--block-5`. Don't add a 6th block without adding the matching variable in `css/theme.css`.

### `content/lessons/<block>-<lesson>.json`

```jsonc
{
  "id": "1-1",
  "title": { "es": "...", "ca": "..." },
  "goal":  { "es": "...", "ca": "..." },     // shown above the exercise
  "topics": [
    {
      "id": "t1",                              // unique within this lesson; used for progress
      "title": { "es": "...", "ca": "..." },
      "goal":  { "es": "...", "ca": "..." },   // optional; falls back to lesson.goal
      "xp": 10,                                // optional, default 10
      "exercises": [ /* see types below */ ]
    }
  ],
  "extras": [ /* same shape as topics, optional, max 2 */ ]
}
```

If a lesson is not yet authored, just leave `placeholder: true` on its manifest entry — no content file required.

### Exercise types

Each topic's `exercises` is an array of objects keyed by `type`.

```jsonc
// Flashcard — show CA + ES + TTS. Always accepted on continue.
{ "type": "flashcard",
  "ca": "Bon dia",
  "es": "Buenos días",
  "note": { "es": "...", "ca": "..." }   // optional contextual note
}

// Multiple choice — pick the correct translation.
{ "type": "multiple_choice",
  "direction": "es-ca",                  // or "ca-es" (then prompt is read aloud)
  "prompt": "Buenos días",
  "options": ["Bon dia", "Bona nit", "Hola"],
  "answer": "Bon dia"
}

// Translate — word-bank; user taps tokens to assemble the answer.
{ "type": "translate",
  "direction": "es-ca",                  // or "ca-es"
  "prompt": "Buenos días",
  "answer": "Bon dia",                   // canonical sentence; matched case/punct-insensitive
  "bank": ["Bon", "dia"],                // tokens shown to the user
  "distractors": ["Bona", "nit"]         // optional extra wrong tokens
}

// Listen — TTS plays the CA phrase; user picks among options.
{ "type": "listen",
  "ca": "Bona tarda",
  "options": ["Bona tarda", "Bon dia", "Bona nit"]
}

// Fill in the blank — sentence with "___" placeholder, choose missing word.
{ "type": "fill_blank",
  "sentence": "Tinc ___ anys.",
  "translation": "Tengo veinticinco años.",   // optional ES gloss
  "options": ["vint-i-cinc", "vinticinc"],
  "answer": "vint-i-cinc"
}

// Compare — pedagogical side-by-side ES vs CA. Always accepted on continue.
{ "type": "compare",
  "es": "España",
  "ca": "Espanya",
  "note": { "es": "...", "ca": "..." }
}

// Pattern — visual rule card showing a morphological/phonological rule with word-pair examples.
// Always accepted on continue. Each CA word has a TTS button.
{ "type": "pattern",
  "rule": { "from": "-ción", "to": "-ció" },   // displayed as: ESPAÑOL -ción → CATALÀ -ció
  "examples": [
    { "es": "nación", "ca": "nació" },
    { "es": "situación", "ca": "situació" }
  ],
  "note": { "es": "...", "ca": "..." }           // optional; shown below the examples
}
```

Conventions:
- Use real Catalan, with proper diacritics (`à è é í ï ò ó ú ü ç l·l`).
- Keep `answer` consistent with `bank` tokens for `translate` exercises.
- For `multiple_choice` keep options short and unambiguous.

## How to add a lesson

1. Open `content/index.json` and either flip an existing entry's `placeholder` to `false`, or add a new lesson entry. Make sure `topicCount` matches reality.
2. Create `content/lessons/<block>-<lesson>.json` following the schema above.
3. Test locally: `python3 -m http.server` and walk through the lesson end to end.
4. Commit. No build, no migration.

## How to translate UI strings

Edit `js/i18n.js`. Keys must exist in **both** `es` and `ca`. Strings here are **only** for chrome (buttons, headers, labels). Lesson content is bilingual by design — never put lesson text here.

## TTS notes

- Voices vary per OS/browser. Catalan (`ca-ES`) is reliably present on macOS and recent Chrome/Edge. Linux often lacks it.
- If no Catalan voice is available, `js/tts.js` falls back to the first Spanish voice and logs a single console notice (`"Lulio: no Catalan TTS voice found; using Spanish as fallback."`). The user-facing string `tts.no_voice` exists in `i18n.js` if you want to surface a banner — currently unused.

## Style and code rules

- Vanilla JS, ES modules, no frameworks. No npm. No bundler. No transpiler.
- New library? Only via CDN, only if it earns its keep. Otherwise inline ~30 LOC.
- Prefer simplicity over abstraction. A senior reviewer should not call this overengineered.
- Keep components small. Don't add state management libraries; `js/state.js` is enough.
- Tests are manual. Smoke-test every change by running the lesson flow locally.

## Versioning & releases

- `content/index.json` carries a `version` field — bump on content changes (semver-ish: patch for typos, minor for new lessons, major for schema breaks).
- Tag releases in git: `git tag v0.2.0 && git push --tags`.
- Add a one-line changelog entry to `README.md` under "Changelog".

## Out of scope (intentional)

- Accounts, backends, analytics.
- Streaks, leaderboards, hearts/lives.
- Service worker / offline mode.
- Automated tests.
- A CMS or admin UI. Editing JSON files is the workflow.

## Known limitations / future ideas

- TTS quality depends on the user's OS — there's no audio fallback.
- Word-bank `translate` is forgiving (case/punctuation-insensitive), but does not accept synonym answers.
- The roadmap progress bar is per-lesson; there's no per-block summary bar yet.
- No spaced-repetition review of past lessons.
- No mobile install prompt / PWA manifest yet.

When in doubt: keep it simple, ship it, iterate.
