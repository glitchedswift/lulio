// Exercise renderer. Each function builds an exercise into a container element
// and returns { check } where check() returns { correct: bool, expected: string }.

import { t } from "./i18n.js";
import { speak } from "./tts.js";
import { getLang } from "./state.js";

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ttsButton(text) {
  const b = el("button", { class: "tts-btn", type: "button", "aria-label": t("lesson.tap_to_hear") }, "🔊");
  b.addEventListener("click", () => speak(text, "ca-ES"));
  return b;
}

// Each renderer returns the constructed { check } API.
export function renderExercise(container, ex) {
  container.innerHTML = "";
  switch (ex.type) {
    case "flashcard": return renderFlashcard(container, ex);
    case "multiple_choice": return renderMultipleChoice(container, ex);
    case "translate": return renderTranslate(container, ex);
    case "listen": return renderListen(container, ex);
    case "fill_blank": return renderFillBlank(container, ex);
    case "compare": return renderCompare(container, ex);
    case "pattern": return renderPattern(container, ex);
    default:
      container.appendChild(el("div", { class: "card" }, "Tipus d'exercici desconegut: " + ex.type));
      return { check: () => ({ correct: true, expected: "" }) };
  }
}

function renderFlashcard(container, ex) {
  const card = el(
    "div",
    { class: "card" },
    el("div", { class: "prompt" }, t("lesson.flashcard")),
    el("p", { class: "target ca" }, ex.ca),
    el("p", { class: "target", style: "color:var(--ink-soft); font-size: clamp(16px,2.4vw,20px); margin-top:6px;" }, ex.es),
    ex.note ? el("div", { class: "compare-note" }, ex.note[getLang()] || ex.note.es || "") : null,
    ttsButton(ex.ca)
  );
  container.appendChild(card);
  // Auto-play once on load.
  setTimeout(() => speak(ex.ca, "ca-ES"), 250);
  // Flashcards are accepted on continue.
  return { check: () => ({ correct: true, expected: ex.ca }), autoAccept: true };
}

function renderMultipleChoice(container, ex) {
  const direction = ex.direction || "es-ca";
  const promptKey = direction === "es-ca" ? "lesson.translate_es_ca" : "lesson.translate_ca_es";
  const promptText = ex.prompt;
  const opts = shuffle(ex.options.slice());
  let selected = null;
  const choicesEl = el("div", { class: "choices two-col" });
  opts.forEach((opt) => {
    const b = el("button", { class: "choice", type: "button" }, opt);
    b.addEventListener("click", () => {
      selected = opt;
      choicesEl.querySelectorAll(".choice").forEach((c) => c.classList.remove("selected"));
      b.classList.add("selected");
    });
    choicesEl.appendChild(b);
  });
  const card = el(
    "div",
    { class: "card" },
    el("div", { class: "prompt" }, t(promptKey)),
    el("p", { class: direction === "es-ca" ? "target" : "target ca" }, promptText),
    direction === "ca-es" ? ttsButton(promptText) : null,
    choicesEl
  );
  container.appendChild(card);
  return {
    check() {
      const correct = selected === ex.answer;
      // Visual feedback on the choices.
      choicesEl.querySelectorAll(".choice").forEach((c) => {
        c.disabled = true;
        if (c.textContent === ex.answer) c.classList.add("correct");
        else if (c.classList.contains("selected")) c.classList.add("incorrect");
      });
      return { correct, expected: ex.answer };
    },
    canCheck: () => selected != null,
  };
}

function renderTranslate(container, ex) {
  // Word-bank style. ex.answer is the canonical sentence; ex.bank is array of tokens;
  // distractors get added to make it harder. Direction defaults to es-ca.
  const direction = ex.direction || "es-ca";
  const promptKey = direction === "es-ca" ? "lesson.translate_es_ca" : "lesson.translate_ca_es";
  const answerTokens = ex.answer.split(/\s+/);
  const bank = shuffle((ex.bank || answerTokens).concat(ex.distractors || []));

  const slot = el("div", { class: "answer-slot" });
  const bankEl = el("div", { class: "bank" });

  function rebuild() {
    bankEl.querySelectorAll(".bank-token").forEach((b, i) => {
      // toggled by class; nothing further here
    });
  }

  bank.forEach((tok, i) => {
    const b = el("button", { class: "bank-token", type: "button", "data-index": i }, tok);
    b.addEventListener("click", () => {
      if (b.classList.contains("used")) return;
      b.classList.add("used");
      const placed = el("button", { class: "bank-token", type: "button" }, tok);
      placed.addEventListener("click", () => {
        b.classList.remove("used");
        placed.remove();
      });
      slot.appendChild(placed);
    });
    bankEl.appendChild(b);
  });

  const card = el(
    "div",
    { class: "card" },
    el("div", { class: "prompt" }, t(promptKey)),
    el("p", { class: direction === "es-ca" ? "target" : "target ca" }, ex.prompt),
    direction === "ca-es" ? ttsButton(ex.prompt) : null,
    slot,
    bankEl
  );
  container.appendChild(card);

  return {
    check() {
      const got = Array.from(slot.querySelectorAll(".bank-token")).map((b) => b.textContent.trim()).join(" ").trim();
      const norm = (s) => s.toLowerCase().replace(/[.,!?¿¡]/g, "").replace(/\s+/g, " ").trim();
      const correct = norm(got) === norm(ex.answer);
      return { correct, expected: ex.answer };
    },
    canCheck() {
      return slot.querySelectorAll(".bank-token").length > 0;
    },
  };
}

function renderListen(container, ex) {
  // Plays ex.ca via TTS, user picks among options or types it.
  const opts = shuffle(ex.options.slice());
  let selected = null;
  const choicesEl = el("div", { class: "choices two-col" });
  opts.forEach((opt) => {
    const b = el("button", { class: "choice", type: "button" }, opt);
    b.addEventListener("click", () => {
      selected = opt;
      choicesEl.querySelectorAll(".choice").forEach((c) => c.classList.remove("selected"));
      b.classList.add("selected");
    });
    choicesEl.appendChild(b);
  });

  const ttsRow = el("div", { style: "display:flex; align-items:center; gap:12px; margin-top:8px;" }, ttsButton(ex.ca), el("span", { style: "color:var(--ink-soft);font-weight:700;" }, t("lesson.tap_to_hear")));

  const card = el(
    "div",
    { class: "card" },
    el("div", { class: "prompt" }, t("lesson.listen_pick")),
    ttsRow,
    choicesEl
  );
  container.appendChild(card);
  setTimeout(() => speak(ex.ca, "ca-ES"), 350);
  return {
    check() {
      const correct = selected === ex.ca;
      choicesEl.querySelectorAll(".choice").forEach((c) => {
        c.disabled = true;
        if (c.textContent === ex.ca) c.classList.add("correct");
        else if (c.classList.contains("selected")) c.classList.add("incorrect");
      });
      return { correct, expected: ex.ca };
    },
    canCheck: () => selected != null,
  };
}

function renderFillBlank(container, ex) {
  // ex.sentence has "___" placeholder. Options to choose. ex.answer is the word.
  const before = ex.sentence.split("___")[0] || "";
  const after = ex.sentence.split("___")[1] || "";
  let selected = null;
  const blank = el("span", { class: "bank-token", style: "min-width:80px; display:inline-flex; justify-content:center;" }, "____");
  const sentenceEl = el(
    "p",
    { class: "target ca", style: "display:flex; flex-wrap:wrap; gap:6px; align-items:center; line-height:1.6; font-size:24px;" }
  );
  sentenceEl.append(document.createTextNode(before), blank, document.createTextNode(after));

  const choicesEl = el("div", { class: "choices two-col" });
  shuffle(ex.options.slice()).forEach((opt) => {
    const b = el("button", { class: "choice", type: "button" }, opt);
    b.addEventListener("click", () => {
      selected = opt;
      blank.textContent = opt;
      choicesEl.querySelectorAll(".choice").forEach((c) => c.classList.remove("selected"));
      b.classList.add("selected");
    });
    choicesEl.appendChild(b);
  });

  const card = el(
    "div",
    { class: "card" },
    el("div", { class: "prompt" }, t("lesson.fill_blank")),
    sentenceEl,
    ex.translation ? el("p", { style: "color:var(--ink-soft); font-size:14px; margin:6px 0 0;" }, ex.translation) : null,
    choicesEl
  );
  container.appendChild(card);
  return {
    check() {
      const correct = selected === ex.answer;
      choicesEl.querySelectorAll(".choice").forEach((c) => {
        c.disabled = true;
        if (c.textContent === ex.answer) c.classList.add("correct");
        else if (c.classList.contains("selected")) c.classList.add("incorrect");
      });
      return { correct, expected: ex.answer };
    },
    canCheck: () => selected != null,
  };
}

function renderPattern(container, ex) {
  const lang = getLang();
  const examplesEl = el("div", { class: "pattern-examples" });
  (ex.examples || []).forEach((pair) => {
    const caBtn = el("button", { class: "pattern-tts", type: "button",
      "aria-label": t("lesson.tap_to_hear") }, pair.ca + " 🔊");
    caBtn.addEventListener("click", () => speak(pair.ca, "ca-ES"));
    examplesEl.appendChild(
      el("div", { class: "pattern-pair" },
        el("span", { class: "ex-es" }, pair.es),
        caBtn
      )
    );
  });
  const card = el("div", { class: "card" },
    el("div", { class: "prompt" }, t("lesson.pattern")),
    el("div", { class: "pattern-rule" },
      el("div", { style: "text-align:center" },
        el("span", { class: "pattern-lang" }, "ESPAÑOL"),
        el("div", { class: "pattern-from" }, ex.rule.from)
      ),
      el("span", { class: "pattern-arrow" }, "→"),
      el("div", { style: "text-align:center" },
        el("span", { class: "pattern-lang" }, "CATALÀ"),
        el("div", { class: "pattern-to" }, ex.rule.to)
      )
    ),
    examplesEl,
    ex.note ? el("div", { class: "compare-note" }, ex.note[lang] || ex.note.es || "") : null
  );
  container.appendChild(card);
  return { check: () => ({ correct: true, expected: "" }), autoAccept: true };
}

function renderCompare(container, ex) {
  // Educational, no choices. Always accepted on continue.
  const card = el(
    "div",
    { class: "card" },
    el("div", { class: "prompt" }, t("lesson.compare")),
    el("div", { class: "compare-grid" },
      el("div", { class: "compare-cell" },
        el("div", { class: "compare-lang" }, "ESPAÑOL"),
        el("div", { class: "compare-text" }, ex.es)
      ),
      el("div", { class: "compare-cell" },
        el("div", { class: "compare-lang" }, "CATALÀ"),
        el("div", { class: "compare-text" }, ex.ca)
      )
    ),
    ex.note ? el("div", { class: "compare-note" }, ex.note[getLang()] || ex.note.es || "") : null,
    ttsButton(ex.ca)
  );
  container.appendChild(card);
  setTimeout(() => speak(ex.ca, "ca-ES"), 250);
  return { check: () => ({ correct: true, expected: ex.ca }), autoAccept: true };
}
