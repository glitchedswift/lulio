import { t } from "../i18n.js";
import { totalLessonsCompleted } from "../state.js";

export function renderHome(el) {
  const visited = totalLessonsCompleted() > 0;
  el.innerHTML = `
    <section class="home">
      <img src="assets/logo.svg" alt="Lulio" class="home-mascot" />
      <h1>Lulio</h1>
      <p>${t("home.tagline")}</p>
      <a class="btn btn-lg home-cta" href="#/roadmap">
        ${visited ? t("home.continue") : t("home.start")}
      </a>
      <small>${t("home.disclaimer")}</small>
    </section>
  `;
}
