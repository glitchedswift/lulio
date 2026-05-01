# CLAUDE.md — Lulio operations guide

This document is the canonical brief for any LLM (or human) maintaining **Lulio**, a static web app that teaches Catalan to Spanish speakers. Read it before making changes.

---

## What Lulio is

- Audience: native or fluent **Spanish speakers** who want to learn **Catalan**.
- Pedagogy: lean on the high overlap between the two Romance languages and surface the *contrasts* (`ny` vs `ñ`, `els` vs `los`, periphrastic past, `hi`/`en`, gender shifts, false friends, etc.).
- Anonymous: no accounts, no backend. Progress is stored in **cookies** in the user's browser.
- 5 progressive blocks (CEFR-aligned, A1 → B2+), totalling 57 lessons. Each lesson has up to 4 required topics and up to 2 optional **extras**. Each block ends with a **block exam**; passing it unlocks the next block.
- Built-in TTS (Web Speech API) for Catalan pronunciation.
- ES/CA UI toggle (lesson **content** is always bilingual; only chrome translates).

### Current content

| Block | CEFR | Lessons | Theme |
|-------|------|---------|-------|
| 1 | A1 | 10 | Greetings, sounds, numbers, articles, false friends, patterns, self-intro, verb -ar, colours |
| 2 | A1+/A2 | 14 | Family, home, food, routine, time, possessives, days, months, ser/estar, demonstratives, interrogatives, verb -re/-ir |
| 3 | A2/B1 | 12 | City navigation, transport, shopping, restaurant, pronouns hi/en, periphrastic past, imperfect, verbal periphrases, body, reflexives, object pronouns |
| 4 | B1/B2 | 12 | Work, opinions, emotions, health, future/conditional, subjunctive, comparatives, negation, present perfect, caldre, relative clauses, conditionals |
| 5 | B2+ | 9 | Traditions, idioms, formal register, advanced false friends, written language, discourse connectors, passive voice, haver-hi, dialectal varieties |

57 lessons total, each ending in a block exam.

## Hosting model — DO NOT BREAK THIS

- **Pure static site** served by GitHub Pages from the repo root of `main`.
- **No build step**, **no bundler**, **no npm**, **no server**. The site is HTML + CSS + ES-module JS + JSON.
- All third-party libraries are loaded from public CDNs (jsDelivr). Don't vendor copies.
- Use **relative URLs** everywhere (e.g. `assets/logo.png`, never `/assets/...`) so Pages project sites under `/<repo>/` work.
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
│   ├── exercises.js          # Renderer + check API for the 7 exercise types
│   └── views/
│       ├── home.js           # Entry screen
│       ├── roadmap.js        # Snake-path map of blocks/lessons
│       ├── lesson.js         # Lesson runner with progress + completion
│       └── exam.js           # Block exam (6-question quiz, 5/6 to pass)
├── content/
│   ├── index.json            # Manifest of blocks → lessons (with placeholder flags)
│   └── lessons/<block>-<lesson>.json
└── assets/
    └── logo.png              # Lulio mascot
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

### How each exercise type is rendered

Understanding the visual layout helps you design exercises whose content fits the UI.

**`flashcard`** — *auto-accept (no right/wrong check)*
```
┌─────────────────────────────────────┐
│  [🔊 TTS plays automatically]       │
│                                      │
│         Bon dia          ← large CA  │
│                                      │
│      Buenos días         ← ES gloss  │
│                                      │
│  ┌─ Note (optional) ──────────────┐  │
│  │ Contextual note text here      │  │
│  └────────────────────────────────┘  │
│                                      │
│          [ Continuar ]               │
└─────────────────────────────────────┘
```
Use for introducing vocabulary. TTS fires on load. The "Continue" button is always enabled — no check needed.

---

**`compare`** — *auto-accept (no right/wrong check)*
```
┌─────────────────────────────────────┐
│  ESPAÑOL          CATALÀ            │
│  ──────────────────────────         │
│  España      →   Espanya  [🔊]      │
│                                      │
│  ┌─ Note (optional) ──────────────┐  │
│  │ Contextual note text here      │  │
│  └────────────────────────────────┘  │
│                                      │
│          [ Continuar ]               │
└─────────────────────────────────────┘
```
Use for single-word or single-phrase contrastive pairs. TTS plays the CA word automatically. Ideal before a `multiple_choice` or `translate` that tests the same word.

---

**`pattern`** — *auto-accept (no right/wrong check)*
```
┌─────────────────────────────────────┐
│  ESPAÑOL  -ción  →  CATALÀ  -ció    │  ← rule box
│                                      │
│  nación          nació      [🔊]     │
│  situación       situació   [🔊]     │
│  (up to ~5 pairs)                    │
│                                      │
│  ┌─ Note (optional) ──────────────┐  │
│  │ Rule clarification text        │  │
│  └────────────────────────────────┘  │
│                                      │
│          [ Continuar ]               │
└─────────────────────────────────────┘
```
Use to teach morphological or phonological rules before testing them. Each CA word has its own TTS button. Keep `examples` to 3–5 pairs — more becomes a wall of text.

---

**`multiple_choice`** — *requires selection*
```
┌─────────────────────────────────────┐
│  Traduce al català                  │  ← direction label
│                                      │
│         Buenos días                 │  ← prompt (large)
│                                      │
│  ┌──────────────┐ ┌──────────────┐  │
│  │   Bon dia    │ │  Bona nit    │  │  ← 2-col shuffled options
│  └──────────────┘ └──────────────┘  │
│  ┌──────────────┐                   │
│  │     Hola     │                   │
│  └──────────────┘                   │
│                                      │
│          [ Comprovar ]               │  ← enabled after tap
└─────────────────────────────────────┘
```
Options are shuffled on every render. Direction `ca-es` plays the prompt via TTS and asks "Traducir al español". Keep options ≤ 4 to avoid layout overflow. Options should be plausibly confusable — avoid obviously wrong distractors.

---

**`translate`** — *requires at least one token placed*
```
┌─────────────────────────────────────┐
│  Traduce al català                  │  ← direction label
│                                      │
│         Buenos días                 │  ← prompt
│                                      │
│  ┌─ Answer slot ───────────────────┐ │
│  │  [Bon] [dia]  ←── placed tokens │ │
│  └─────────────────────────────────┘ │
│                                      │
│  Word bank (shuffled):               │
│  [ Bona ] [ nit ] [ Bon ] [ dia ]   │
│                                      │
│          [ Comprovar ]               │  ← enabled after any tap
└─────────────────────────────────────┘
```
Tapping a bank token moves it to the slot; tapping a slot token returns it. Matching is case- and punctuation-insensitive. The `bank` array contains the correct tokens; `distractors` adds wrong tokens. Keep answers to ≤ 6 tokens — longer sentences are awkward on mobile.

---

**`fill_blank`** — *requires selection*
```
┌─────────────────────────────────────┐
│  Completa la frase                  │
│                                      │
│   Tinc _______ anys.                │  ← inline blank (24 px wide)
│   Tengo veinticinco años.           │  ← optional ES translation
│                                      │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ vint-i-cinc  │ │   vinticinc  │  │  ← 2-col options
│  └──────────────┘ └──────────────┘  │
│                                      │
│          [ Comprovar ]               │  ← enabled after tap
└─────────────────────────────────────┘
```
Tapping an option fills the blank inline; tapping again deselects. Include the `translation` field whenever the Catalan sentence would be opaque without it. Keep `options` to exactly 2 — the layout is a 2-column grid.

---

**`listen`** — *requires selection; TTS auto-plays on load*
```
┌─────────────────────────────────────┐
│  Escolta i tria el que sents        │
│                                      │
│          [ 🔊 Escoltar ]            │  ← large TTS button, re-playable
│                                      │
│  ┌──────────────┐ ┌──────────────┐  │
│  │  Bona tarda  │ │   Bon dia    │  │  ← 2-col shuffled options
│  └──────────────┘ └──────────────┘  │
│  ┌──────────────┐                   │
│  │  Bona nit    │                   │
│  └──────────────┘                   │
│                                      │
│          [ Comprovar ]               │  ← enabled after tap
└─────────────────────────────────────┘
```
TTS plays the `ca` string automatically and again on button tap. Keep options ≤ 4. Use for phrases that are easy to confuse aurally (e.g. `bon dia` / `bona tarda` / `bona nit`). The correct answer must be one of the `options`.

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
