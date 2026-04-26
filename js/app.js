import { defineRoute, startRouter } from "./router.js";
import { loadState, getLang, setLang, getState, onChange } from "./state.js";
import { renderHome } from "./views/home.js";
import { renderRoadmap } from "./views/roadmap.js";
import { renderLesson } from "./views/lesson.js";

function syncLangToggle() {
  const lang = getLang();
  document.documentElement.setAttribute("lang", lang === "ca" ? "ca" : "es");
  document.querySelectorAll("#lang-toggle [data-lang]").forEach((sp) => {
    sp.classList.toggle("active", sp.dataset.lang === lang);
  });
}

function syncXp() {
  const v = document.getElementById("xp-value");
  if (v) v.textContent = String(getState().xp);
}

function setupTopBar() {
  const toggle = document.getElementById("lang-toggle");
  toggle.addEventListener("click", () => {
    setLang(getLang() === "es" ? "ca" : "es");
  });
  syncLangToggle();
  syncXp();
  onChange(() => {
    syncLangToggle();
    syncXp();
    // Re-render current view so translated UI updates.
    if (location.hash.startsWith("#/roadmap") || location.hash === "#/" || location.hash === "") {
      // Trigger router to re-render.
      const ev = new HashChangeEvent("hashchange");
      window.dispatchEvent(ev);
    }
  });
}

function init() {
  loadState();
  setupTopBar();

  defineRoute("/", (el) => renderHome(el));
  defineRoute("/roadmap", (el) => renderRoadmap(el));
  defineRoute("/lesson/:id", (el, params) => renderLesson(el, params));

  startRouter(document.getElementById("view"));
}

init();
