import { t } from "../i18n.js";
import { loadIndex, loadLesson } from "../content.js";
import { renderExercise } from "../exercises.js";
import { getLang, markTopicComplete, markLessonComplete } from "../state.js";
import { playCorrect, playWrong } from "../sfx.js";

export async function renderLesson(el, params) {
  const lessonId = params.id;
  el.innerHTML = `<div class="placeholder"><div>…</div></div>`;

  let index;
  try {
    index = await loadIndex();
  } catch (err) {
    el.innerHTML = `<div class="placeholder"><div class="ph-emoji">⚠️</div><h2>Error</h2><p>${err.message}</p></div>`;
    return;
  }

  const [blockId, lessonNum] = lessonId.split("-");
  const blockIndex = index.blocks.findIndex((b) => String(b.id) === String(blockId));
  const block = index.blocks[blockIndex];
  const blockColor = `var(--block-${blockIndex + 1})`;
  const blockSoft = `var(--block-${blockIndex + 1}-soft)`;
  const lessonEntry = block && block.lessons.find((l) => String(l.id) === String(lessonNum));
  const isPlaceholder = !lessonEntry || lessonEntry.placeholder === true;

  let data = null;
  if (!isPlaceholder) {
    try {
      data = await loadLesson(lessonId);
    } catch (err) {
      // Fall back to placeholder UI rather than erroring out.
      el.innerHTML = `
        <div class="placeholder" style="--block-color:${blockColor};">
          <div class="ph-emoji">🌱</div>
          <h2>${t("lesson.placeholder.title")}</h2>
          <p>${t("lesson.placeholder.body")}</p>
          <a class="btn btn-secondary" href="#/roadmap">${t("lesson.back")}</a>
        </div>
      `;
      return;
    }
  }

  if (isPlaceholder || (data && data.placeholder)) {
    el.innerHTML = `
      <div class="placeholder" style="--block-color:${blockColor};">
        <div class="ph-emoji">🌱</div>
        <h2>${t("lesson.placeholder.title")}</h2>
        <p>${t("lesson.placeholder.body")}</p>
        <a class="btn btn-secondary" href="#/roadmap">${t("lesson.back")}</a>
      </div>
    `;
    return;
  }

  // Build topic queue: required topics first, then extras (optional).
  const lang = getLang();
  const topics = [...(data.topics || []).map((t0) => ({ ...t0, isExtra: false })),
                  ...(data.extras || []).map((t0) => ({ ...t0, isExtra: true }))];
  if (topics.length === 0) {
    el.innerHTML = `<div class="placeholder"><h2>${t("lesson.placeholder.title")}</h2></div>`;
    return;
  }

  let topicIndex = 0;
  let exerciseIndex = 0;
  let mistakes = 0;

  el.innerHTML = `
    <div class="lesson-shell" style="--block-color:${blockColor}; --block-soft:${blockSoft};">
      <div class="lesson-header">
        <button class="lesson-back" id="back" aria-label="${t("lesson.back")}">←</button>
        <div class="progress"><div id="progress-bar"></div></div>
      </div>
      <div class="lesson-meta">
        <h1 id="lesson-title"></h1>
        <span class="topic-pill" id="topic-pill"></span>
      </div>
      <div class="goal" id="goal"></div>
      <div id="exercise-mount"></div>
      <div class="lesson-footer">
        <button class="btn btn-secondary lesson-prev" id="prev" type="button" aria-label="${t("lesson.previous")}" disabled>←</button>
        <button class="btn btn-ghost" id="skip" type="button">${t("lesson.skip")}</button>
        <button class="btn" id="check" type="button" disabled>${t("lesson.check")}</button>
      </div>
    </div>
  `;

  const $ = (id) => el.querySelector("#" + id);
  $("back").addEventListener("click", () => { location.hash = "#/roadmap"; });
  $("skip").addEventListener("click", () => nextTopic(true));
  $("prev").addEventListener("click", () => previousExercise());

  const titleEl = $("lesson-title");
  const goalEl = $("goal");
  const pill = $("topic-pill");
  const progressBar = $("progress-bar");
  const mount = $("exercise-mount");
  const checkBtn = $("check");
  const skipBtn = $("skip");
  const prevBtn = $("prev");

  // Static lesson title.
  const lessonTitle = (data.title && (data.title[lang] || data.title.es)) || lessonId;
  titleEl.textContent = lessonTitle;

  let currentApi = null;

  function setProgress() {
    const totalSteps = topics.reduce((s, tp) => s + tp.exercises.length, 0);
    let done = 0;
    for (let i = 0; i < topicIndex; i++) done += topics[i].exercises.length;
    done += exerciseIndex;
    progressBar.style.width = Math.min(100, (done / totalSteps) * 100) + "%";
  }

  function showExercise() {
    // Always make sure the footer is visible — even after a wrong answer's
    // feedback panel hid it.
    el.querySelector(".lesson-footer").style.display = "";

    const topic = topics[topicIndex];
    const ex = topic.exercises[exerciseIndex];
    pill.textContent = `${topic.isExtra ? t("lesson.extra") : t("lesson.topic")} · ${(topic.title && (topic.title[lang] || topic.title.es)) || ""}`;
    pill.className = "topic-pill" + (topic.isExtra ? " extra-pill" : "");
    const goal = (topic.goal && (topic.goal[lang] || topic.goal.es)) || (data.goal && (data.goal[lang] || data.goal.es)) || "";
    goalEl.innerHTML = goal ? `<strong>${t("lesson.goal")}:</strong> ${goal}` : "";
    goalEl.style.display = goal ? "" : "none";

    currentApi = renderExercise(mount, ex);
    setProgress();
    if (currentApi.autoAccept) {
      checkBtn.textContent = t("lesson.continue");
      checkBtn.disabled = false;
    } else {
      checkBtn.textContent = t("lesson.check");
      checkBtn.disabled = !(currentApi.canCheck && currentApi.canCheck());
    }
    prevBtn.disabled = topicIndex === 0 && exerciseIndex === 0;
  }

  function previousExercise() {
    // Drop any visible feedback from a previous attempt.
    const fb = document.querySelector(".feedback");
    if (fb) fb.remove();
    if (exerciseIndex > 0) {
      exerciseIndex -= 1;
    } else if (topicIndex > 0) {
      topicIndex -= 1;
      exerciseIndex = topics[topicIndex].exercises.length - 1;
    } else {
      return;
    }
    showExercise();
  }

  // Refresh the canCheck enable state on every click within the exercise area.
  mount.addEventListener("click", () => {
    if (!currentApi || currentApi.autoAccept) return;
    checkBtn.disabled = !(currentApi.canCheck && currentApi.canCheck());
  });

  function showFeedback(correct, expected, onContinue) {
    let fb = el.querySelector(".feedback");
    if (fb) fb.remove();
    fb = document.createElement("div");
    fb.className = "feedback " + (correct ? "correct" : "incorrect");
    fb.innerHTML = `
      <div class="feedback-text">${correct ? t("lesson.correct") : t("lesson.incorrect") + " <em>" + expected + "</em>"}</div>
      <button class="btn ${correct ? "" : "btn-accent"}" id="fb-continue">${t("lesson.continue")}</button>
    `;
    document.body.appendChild(fb);
    requestAnimationFrame(() => fb.classList.add("shown"));
    fb.querySelector("#fb-continue").addEventListener("click", () => {
      fb.classList.remove("shown");
      setTimeout(() => fb.remove(), 250);
      onContinue();
    });
    // Hide the regular footer briefly while feedback is up.
    el.querySelector(".lesson-footer").style.display = "none";
  }

  function advance() {
    const topic = topics[topicIndex];
    exerciseIndex += 1;
    if (exerciseIndex >= topic.exercises.length) {
      // Topic done.
      markTopicComplete(lessonId, topic.id, topic.isExtra, topic.xp || 10);
      topicIndex += 1;
      exerciseIndex = 0;
    }
    if (topicIndex >= topics.length) {
      finishLesson();
      return;
    }
    showExercise();
  }

  function nextTopic(skipped) {
    const topic = topics[topicIndex];
    if (!skipped) {
      markTopicComplete(lessonId, topic.id, topic.isExtra, topic.xp || 10);
    }
    topicIndex += 1;
    exerciseIndex = 0;
    if (topicIndex >= topics.length) {
      finishLesson();
      return;
    }
    showExercise();
  }

  function finishLesson() {
    markLessonComplete(lessonId);
    setProgress();
    progressBar.style.width = "100%";
    el.innerHTML = `
      <section class="completion">
        <img src="assets/logo.svg" alt="Lulio" class="completion-mascot" />
        <h1>${t("completion.title")}</h1>
        <p>${t("completion.subtitle")}</p>
        <span class="xp-gain">★ +${topics.reduce((s, tp) => s + (tp.xp || 10), 0)} XP</span>
        <a class="btn btn-lg" href="#/roadmap">${t("completion.back_to_map")}</a>
      </section>
    `;
    if (window.confetti) {
      window.confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => window.confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 } }), 250);
    }
  }

  checkBtn.addEventListener("click", () => {
    if (!currentApi) return;
    if (currentApi.autoAccept) {
      advance();
      return;
    }
    const { correct, expected } = currentApi.check();
    if (!correct) mistakes += 1;
    if (correct) playCorrect(); else playWrong();
    showFeedback(correct, expected, () => {
      if (correct) {
        advance();
      } else {
        // Re-show the same exercise (regenerate to reset state) — simple retry.
        showExercise();
      }
    });
  });

  showExercise();

  return () => {
    const fb = document.querySelector(".feedback");
    if (fb) fb.remove();
  };
}
