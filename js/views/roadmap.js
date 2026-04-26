import { t } from "../i18n.js";
import { loadIndex } from "../content.js";
import { getLessonProgress, isLessonComplete, totalLessonsCompleted, getLang } from "../state.js";

export async function renderRoadmap(el) {
  el.innerHTML = `<div class="placeholder"><div>${t("roadmap.title")}…</div></div>`;
  let index;
  try {
    index = await loadIndex();
  } catch (err) {
    el.innerHTML = `<div class="placeholder"><div class="ph-emoji">⚠️</div><h2>Error</h2><p>${err.message}</p></div>`;
    return;
  }

  const lang = getLang();
  const totalLessons = index.blocks.reduce((s, b) => s + b.lessons.length, 0);
  const done = totalLessonsCompleted();

  const blockHtml = index.blocks
    .map((block, bi) => {
      const blockColor = `var(--block-${bi + 1})`;
      const blockSoft = `var(--block-${bi + 1}-soft)`;
      const rows = block.lessons
        .map((lesson) => {
          const id = `${block.id}-${lesson.id}`;
          const placeholder = !!lesson.placeholder;
          const complete = !placeholder && isLessonComplete(id, lesson.topicCount || 0)
                            && (getLessonProgress(id).completedAt !== null);
          const cls = ["lesson-node"];
          if (complete) cls.push("done");
          if (placeholder) cls.push("placeholder");
          const label = (lesson.title && (lesson.title[lang] || lesson.title.es)) || id;
          const inner = placeholder ? "·" : (complete ? "✓" : (lesson.icon || "★"));
          return `
            <div class="path-row">
              <a class="${cls.join(" ")}" href="#/lesson/${id}" aria-label="${label}">
                ${inner}
                <span class="lesson-node-label">${label}</span>
              </a>
            </div>
          `;
        })
        .join("");
      const title = (block.title && (block.title[lang] || block.title.es)) || `Bloc ${bi + 1}`;
      const sub = (block.subtitle && (block.subtitle[lang] || block.subtitle.es)) || "";
      return `
        <section class="block" style="--block-color:${blockColor}; --block-soft:${blockSoft};">
          <header class="block-header">
            <span class="block-eyebrow">${(block.level || `Bloc ${bi + 1}`)}</span>
            <h2>${title}</h2>
            ${sub ? `<span class="block-sub">${sub}</span>` : ""}
          </header>
          <div class="path">${rows}</div>
        </section>
      `;
    })
    .join("");

  el.innerHTML = `
    <div class="roadmap-header">
      <h1>${t("roadmap.title")}</h1>
      <span class="stat">${done} / ${totalLessons} ${t("roadmap.lessons_done")}</span>
    </div>
    ${blockHtml}
  `;
}
