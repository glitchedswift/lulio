import { t } from "../i18n.js";

export function renderHome(el) {
  el.innerHTML = `
    <section class="home">
      <div class="home-hero">
        <div class="home-mascot-area">
          <div class="home-fc">
            <span class="home-fc-icon">⚡</span>
            <div class="home-fc-text">
              <strong>${t("home.fc1.title")}</strong>
              <p>${t("home.fc1.body")}</p>
            </div>
          </div>
          <img src="assets/logo.svg" alt="Lulio" class="home-mascot" />
          <div class="home-fc-right-group">
            <div class="home-fc">
              <span class="home-fc-icon">🧠</span>
              <div class="home-fc-text">
                <strong>${t("home.fc2.title")}</strong>
                <p>${t("home.fc2.body")}</p>
              </div>
            </div>
            <div class="home-fc">
              <span class="home-fc-icon">🎯</span>
              <div class="home-fc-text">
                <strong>${t("home.fc3.title")}</strong>
                <p>${t("home.fc3.body")}</p>
              </div>
            </div>
          </div>
        </div>
        <h1>Lulio</h1>
        <p class="home-tagline">${t("home.tagline")}</p>
        <div class="home-badge">⏱ ${t("home.badge")}</div>
        <a class="btn btn-lg home-cta" href="#/roadmap">▶ ${t("home.start")}</a>
        <small class="home-disclaimer">${t("home.disclaimer")}</small>
      </div>
      <div class="home-bottom">
        <div class="home-bottom-card">
          <span class="home-bc-icon">⭐</span>
          <div>
            <strong>${t("home.card1.title")}</strong>
            <p>${t("home.card1.body")}</p>
          </div>
        </div>
        <div class="home-bottom-card">
          <span class="home-bc-icon home-bc-check">✓</span>
          <div>
            <strong>${t("home.card2.title")}</strong>
            <p>${t("home.card2.body")}</p>
          </div>
        </div>
        <div class="home-bottom-card">
          <span class="home-bc-icon home-bc-warn">⚠</span>
          <div>
            <strong>${t("home.card3.title")}</strong>
            <p>${t("home.card3.body")}</p>
          </div>
        </div>
        <div class="home-bottom-card">
          <span class="home-bc-icon home-bc-play">😊</span>
          <div>
            <strong>${t("home.card4.title")}</strong>
            <p>${t("home.card4.body")}</p>
          </div>
        </div>
      </div>
    </section>
  `;
}
