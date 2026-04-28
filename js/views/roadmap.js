import { t } from "../i18n.js";
import { loadIndex } from "../content.js";
import { getLessonProgress, isLessonComplete, totalLessonsCompleted, getLang, isBlockExamPassed } from "../state.js";

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

function showToast(msg) {
  let toast = document.querySelector(".roadmap-toast");
  if (toast) toast.remove();
  toast = document.createElement("div");
  toast.className = "roadmap-toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("shown"));
  setTimeout(() => {
    toast.classList.remove("shown");
    setTimeout(() => toast.remove(), 400);
  }, 2500);
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

  // Determine each block's state: complete / current / locked
  const blockStates = index.blocks.map((block) => {
    const nonPlaceholders = block.lessons.filter((l) => !l.placeholder);
    const lessonsDone = nonPlaceholders.length > 0 && nonPlaceholders.every((lesson) => {
      const id = `${block.id}-${lesson.id}`;
      return isLessonComplete(id, lesson.topicCount || 0) && getLessonProgress(id).completedAt !== null;
    });
    const examPassed = isBlockExamPassed(block.id);
    return { complete: examPassed || lessonsDone, examPassed };
  });

  const firstIncomplete = blockStates.findIndex((s) => !s.complete);
  const allComplete = firstIncomplete === -1;

  const blockHtml = index.blocks
    .map((block, bi) => {
      const blockColor = `var(--block-${bi + 1})`;
      const blockSoft = `var(--block-${bi + 1}-soft)`;
      const { complete, examPassed } = blockStates[bi];
      const isCurrent = bi === firstIncomplete;
      const isLocked = !allComplete && bi > firstIncomplete;

      const rows = block.lessons
        .map((lesson) => {
          const id = `${block.id}-${lesson.id}`;
          const placeholder = !!lesson.placeholder;
          const lessonComplete = !placeholder && isLessonComplete(id, lesson.topicCount || 0)
                            && (getLessonProgress(id).completedAt !== null);
          const cls = ["lesson-node"];
          if (lessonComplete) cls.push("done");
          if (placeholder) cls.push("placeholder");
          const label = (lesson.title && (lesson.title[lang] || lesson.title.es)) || id;
          const inner = placeholder ? "·" : (lessonComplete ? "✓" : (lesson.icon || "★"));
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

      // Exam node always at the bottom of each block
      const examCls = ["lesson-node", "exam-node"];
      if (examPassed) examCls.push("done");
      const examLabel = t("exam.node.label");
      const examInner = examPassed ? "✓" : "📝";
      const examRow = `
        <div class="path-row">
          <a class="${examCls.join(" ")}" href="#/exam/${block.id}" aria-label="${examLabel}">
            ${examInner}
            <span class="lesson-node-label">${examLabel}</span>
          </a>
        </div>
      `;

      const title = (block.title && (block.title[lang] || block.title.es)) || `Bloc ${bi + 1}`;
      const sub = (block.subtitle && (block.subtitle[lang] || block.subtitle.es)) || "";
      const blockCls = ["block"];
      let badge = "";
      let toggleAttrs = "";

      if (complete) {
        blockCls.push("block--complete", "block--collapsed");
        const completedLabel = lang === "ca" ? "Completat" : "Completado";
        badge = `<span class="block-complete-badge">✓ ${completedLabel}</span><span class="block-chevron" aria-hidden="true">▾</span>`;
        toggleAttrs = ` role="button" tabindex="0" aria-expanded="false"`;
      } else if (isLocked) {
        blockCls.push("block--locked", "block--collapsed");
        badge = `<span class="block-locked-badge">🔒</span><span class="block-chevron" aria-hidden="true">▾</span>`;
        toggleAttrs = ` role="button" tabindex="0" aria-expanded="false"`;
      }

      return `
        <section class="${blockCls.join(" ")}" style="--block-color:${blockColor}; --block-soft:${blockSoft};" data-locked="${isLocked}">
          <header class="block-header${(complete || isLocked) ? " block-header--toggleable" : ""}"${toggleAttrs}>
            <div class="block-header-content">
              <span class="block-eyebrow">${(block.level || `Bloc ${bi + 1}`)}</span>
              <h2>${title}</h2>
              ${sub ? `<span class="block-sub">${sub}</span>` : ""}
            </div>
            ${badge}
          </header>
          <div class="path">${rows}${examRow}</div>
        </section>
      `;
    })
    .join("");

  const congratsHtml = allComplete ? `
    <div class="roadmap-congrats">
      <div class="roadmap-congrats-emoji">🎉</div>
      <h2>${t("roadmap.congrats.title")}</h2>
      <p>${t("roadmap.congrats.body")}</p>
    </div>
  ` : "";

  el.innerHTML = `
    <div class="roadmap-header">
      <h1>${t("roadmap.title")}</h1>
      ${progressRing(done, totalLessons)}
    </div>
    ${blockHtml}
    ${congratsHtml}
  `;

  // Toggle collapse on complete and locked block headers
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

  // Show toast when clicking any node inside a locked block (navigation still proceeds)
  el.querySelectorAll(".block[data-locked='true']").forEach((section) => {
    section.addEventListener("click", (e) => {
      const node = e.target.closest(".lesson-node, .exam-node");
      if (node && node.getAttribute("href")) {
        showToast(t("roadmap.locked_toast"));
      }
    });
  });
}
