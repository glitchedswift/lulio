import { t } from "../i18n.js";
import { loadIndex } from "../content.js";
import { getLessonProgress, isLessonComplete, totalLessonsCompleted, getLang } from "../state.js";

function progressRing(done, total) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const dash = (pct * circ).toFixed(2);
  return `
    <div class="stat-ring-wrap" aria-label="${done} / ${total} ${t("roadmap.lessons_done")}">
      <svg class="stat-ring" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
        <circle class="stat-ring-track" cx="32" cy="32" r="${r}" />
        <circle class="stat-ring-fill" cx="32" cy="32" r="${r}"
          stroke-dasharray="${dash} ${circ.toFixed(2)}"
          transform="rotate(-90 32 32)" />
      </svg>
      <div class="stat-ring-label">
        <span class="stat-done">${done}</span>
        <span class="stat-sep">/${total}</span>
      </div>
    </div>
  `;
}

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

      const nonPlaceholders = block.lessons.filter((l) => !l.placeholder);
      const allDone = nonPlaceholders.length > 0 && nonPlaceholders.every((lesson) => {
        const id = `${block.id}-${lesson.id}`;
        return isLessonComplete(id, lesson.topicCount || 0) && getLessonProgress(id).completedAt !== null;
      });

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
      const blockCls = ["block"];
      if (allDone) blockCls.push("block--complete", "block--collapsed");
      const completedLabel = lang === "ca" ? "Completat" : "Completado";
      const toggleAttrs = allDone ? ` role="button" tabindex="0" aria-expanded="false"` : "";
      return `
        <section class="${blockCls.join(" ")}" style="--block-color:${blockColor}; --block-soft:${blockSoft};">
          <header class="block-header${allDone ? " block-header--toggleable" : ""}"${toggleAttrs}>
            <div class="block-header-content">
              <span class="block-eyebrow">${(block.level || `Bloc ${bi + 1}`)}</span>
              <h2>${title}</h2>
              ${sub ? `<span class="block-sub">${sub}</span>` : ""}
            </div>
            ${allDone ? `<span class="block-complete-badge">✓ ${completedLabel}</span><span class="block-chevron" aria-hidden="true">▾</span>` : ""}
          </header>
          <div class="path">${rows}</div>
        </section>
      `;
    })
    .join("");

  el.innerHTML = `
    <div class="roadmap-header">
      <h1>${t("roadmap.title")}</h1>
      ${progressRing(done, totalLessons)}
    </div>
    ${blockHtml}
  `;

  el.querySelectorAll(".block-header--toggleable").forEach((header) => {
    const toggle = () => {
      const section = header.closest(".block");
      const collapsed = section.classList.toggle("block--collapsed");
      header.setAttribute("aria-expanded", String(!collapsed));
    };
    header.addEventListener("click", toggle);
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });
}
