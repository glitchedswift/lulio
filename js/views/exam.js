import { t } from "../i18n.js";
import { loadIndex, loadLesson } from "../content.js";
import { renderExercise } from "../exercises.js";
import { getLang, markBlockExamPassed, isBlockExamPassed, addXp } from "../state.js";
import { playCorrect, playWrong } from "../sfx.js";
import { trackEvent } from "../analytics.js";

const CHECKABLE = new Set(["multiple_choice", "translate", "listen", "fill_blank"]);
const EXAM_XP = 20;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function buildExercisePool(block) {
  const results = await Promise.allSettled(
    block.lessons
      .filter((l) => !l.placeholder)
      .map((l) => loadLesson(`${block.id}-${l.id}`))
  );

  const pool = [];
  results.forEach((r) => {
    if (r.status !== "fulfilled") return;
    const data = r.value;
    const allTopics = [...(data.topics || []), ...(data.extras || [])];
    // Collect checkable exercises tagged with their lesson id
    const lessonExs = [];
    allTopics.forEach((topic) => {
      (topic.exercises || []).forEach((ex) => {
        if (CHECKABLE.has(ex.type)) lessonExs.push({ ...ex, _lessonId: data.id });
      });
    });
    // At most 2 exercises per lesson for variety
    shuffle(lessonExs).slice(0, 2).forEach((ex) => pool.push(ex));
  });

  return shuffle(pool).slice(0, 6);
}

export async function renderExam(el, params) {
  const blockId = params.id;
  el.innerHTML = `<div class="placeholder"><div>…</div></div>`;

  let index;
  try {
    index = await loadIndex();
  } catch (err) {
    el.innerHTML = `<div class="placeholder"><div class="ph-emoji">⚠️</div><h2>Error</h2><p>${err.message}</p></div>`;
    return;
  }

  const blockIndex = index.blocks.findIndex((b) => String(b.id) === String(blockId));
  if (blockIndex === -1) {
    el.innerHTML = `<div class="placeholder"><div class="ph-emoji">⚠️</div><h2>Error</h2><p>Block not found.</p></div>`;
    return;
  }

  const block = index.blocks[blockIndex];
  const lang = getLang();
  const blockColor = `var(--block-${blockIndex + 1})`;
  const blockSoft = `var(--block-${blockIndex + 1}-soft)`;
  const blockTitle = (block.title && (block.title[lang] || block.title.es)) || `Bloc ${blockId}`;

  // Already passed — just redirect to roadmap.
  if (isBlockExamPassed(blockId)) {
    location.hash = "#/roadmap";
    return;
  }

  el.innerHTML = `<div class="placeholder"><div>${t("exam.loading")}</div></div>`;

  let exercises;
  try {
    exercises = await buildExercisePool(block);
  } catch (err) {
    el.innerHTML = `<div class="placeholder"><div class="ph-emoji">⚠️</div><h2>Error</h2><p>${err.message}</p></div>`;
    return;
  }

  if (exercises.length === 0) {
    el.innerHTML = `<div class="placeholder"><div class="ph-emoji">🌱</div><h2>${t("exam.title")}</h2><p>No hay ejercicios disponibles en este bloque.</p><a class="btn btn-secondary" href="#/roadmap">${t("exam.back")}</a></div>`;
    return;
  }

  const passThreshold = exercises.length <= 4 ? exercises.length - 1 : 5;

  function runExam(exList) {
    let exIndex = 0;
    let correct = 0;
    let currentApi = null;

    el.innerHTML = `
      <div class="lesson-shell" style="--block-color:${blockColor}; --block-soft:${blockSoft};">
        <div class="lesson-header">
          <button class="lesson-back" id="back" aria-label="${t("exam.back")}">←</button>
          <div class="progress-wrap">
            <div class="progress"><div id="progress-bar"></div></div>
            <span id="progress-pct" class="progress-pct">0%</span>
          </div>
        </div>
        <div class="lesson-meta">
          <h1>${t("exam.title")}</h1>
          <span class="topic-pill" style="background:${blockColor};">${blockTitle}</span>
        </div>
        <div class="goal" id="goal"><strong>${t("exam.subtitle")}</strong></div>
        <div id="exercise-mount"></div>
        <div class="lesson-footer">
          <span></span>
          <span></span>
          <button class="btn" id="check" type="button" disabled>${t("lesson.check")}</button>
        </div>
      </div>
    `;

    const $ = (id) => el.querySelector("#" + id);
    $("back").addEventListener("click", () => { location.hash = "#/roadmap"; });

    const progressBar = $("progress-bar");
    const progressPct = $("progress-pct");
    const mount = $("exercise-mount");
    const checkBtn = $("check");

    function setProgress() {
      const pct = Math.round((exIndex / exList.length) * 100);
      progressBar.style.width = pct + "%";
      progressPct.textContent = pct + "%";
    }

    function showFeedback(isCorrect, expected, onContinue) {
      let fb = el.querySelector(".feedback");
      if (fb) fb.remove();
      fb = document.createElement("div");
      fb.className = "feedback " + (isCorrect ? "correct" : "incorrect");
      const msg = isCorrect
        ? t("lesson.correct")
        : t("lesson.incorrect") + " <em>" + expected + "</em>";
      fb.innerHTML = `
        <div class="feedback-text">${msg}</div>
        <button class="btn ${isCorrect ? "" : "btn-accent"}" id="fb-continue">${t("lesson.continue")}</button>
      `;
      document.body.appendChild(fb);
      requestAnimationFrame(() => fb.classList.add("shown"));

      let timer = null;
      const dismiss = () => {
        if (timer) { clearTimeout(timer); timer = null; }
        fb.classList.remove("shown");
        setTimeout(() => fb.remove(), 250);
        onContinue();
      };
      fb.querySelector("#fb-continue").addEventListener("click", dismiss);
      if (isCorrect) timer = setTimeout(dismiss, 1300);
      el.querySelector(".lesson-footer").style.display = "none";
    }

    function showExercise() {
      el.querySelector(".lesson-footer").style.display = "";
      const ex = exList[exIndex];
      currentApi = renderExercise(mount, ex);
      setProgress();
      if (currentApi.autoAccept) {
        checkBtn.textContent = t("lesson.continue");
        checkBtn.disabled = false;
      } else {
        checkBtn.textContent = t("lesson.check");
        checkBtn.disabled = !(currentApi.canCheck && currentApi.canCheck());
      }
    }

    mount.addEventListener("click", () => {
      if (!currentApi || currentApi.autoAccept) return;
      checkBtn.disabled = !(currentApi.canCheck && currentApi.canCheck());
    });

    function advance(wasCorrect) {
      if (wasCorrect) correct += 1;
      exIndex += 1;
      if (exIndex >= exList.length) {
        showResults();
        return;
      }
      showExercise();
    }

    function showResults() {
      const passed = correct >= passThreshold;
      progressBar.style.width = "100%";
      progressPct.textContent = "100%";

      if (passed) {
        markBlockExamPassed(blockId);
        addXp(EXAM_XP);
        trackEvent("block-exam-pass/" + blockId);
      }

      const scoreLabel = t("exam.score")
        .replace("{correct}", correct)
        .replace("{total}", exList.length);

      el.innerHTML = `
        <section class="completion">
          <img src="assets/logo.png" alt="Lulio" class="completion-mascot" />
          <h1>${passed ? t("exam.pass.title") : t("exam.fail.title")}</h1>
          <p>${passed ? t("exam.pass.subtitle") : t("exam.fail.subtitle")}</p>
          <span class="xp-gain">${scoreLabel}</span>
          ${passed
            ? `<span class="xp-gain">★ +${EXAM_XP} XP</span><a class="btn btn-lg" href="#/roadmap">${t("exam.back")}</a>`
            : `<button class="btn btn-lg" id="retry">${t("exam.fail.retry")}</button>
               <a class="btn btn-secondary" href="#/roadmap">${t("exam.back")}</a>`
          }
        </section>
      `;

      if (passed && window.confetti) {
        window.confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => window.confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 } }), 250);
      }

      const retryBtn = el.querySelector("#retry");
      if (retryBtn) retryBtn.addEventListener("click", () => runExam(exList));
    }

    checkBtn.addEventListener("click", () => {
      if (!currentApi) return;
      if (currentApi.autoAccept) { advance(true); return; }
      const { correct: isCorrect, expected } = currentApi.check();
      if (isCorrect) playCorrect(); else playWrong();
      showFeedback(isCorrect, expected, () => advance(isCorrect));
    });

    showExercise();
  }

  runExam(exercises);

  return () => {
    const fb = document.querySelector(".feedback");
    if (fb) fb.remove();
  };
}
