import { t } from "../i18n.js";
import { hasChosenLevel, setStartingBlock } from "../state.js";
import { navigate } from "../router.js";

const LEVELS = [
  { block: 1, cefr: "A1",     labelKey: "level.a1.label", hintKey: "level.a1.hint", colorVar: "--block-1" },
  { block: 2, cefr: "A1+/A2", labelKey: "level.a2.label", hintKey: "level.a2.hint", colorVar: "--block-2" },
  { block: 3, cefr: "A2/B1",  labelKey: "level.b1.label", hintKey: "level.b1.hint", colorVar: "--block-3" },
  { block: 4, cefr: "B1/B2",  labelKey: "level.b2.label", hintKey: "level.b2.hint", colorVar: "--block-4" },
  { block: 5, cefr: "B2+",    labelKey: "level.b2p.label", hintKey: "level.b2p.hint", colorVar: "--block-5" },
];

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
          <img src="assets/logo.png" alt="Lulio" class="home-mascot" />
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
        <button class="btn btn-lg home-cta" id="home-start-btn" type="button">▶ ${t("home.start")}</button>
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

  el.querySelector("#home-start-btn").addEventListener("click", () => {
    if (hasChosenLevel()) {
      navigate("#/roadmap");
    } else {
      showLevelSelector();
    }
  });
}

function showLevelSelector() {
  const overlay = document.createElement("div");
  overlay.className = "level-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const cards = LEVELS.map(({ block, cefr, labelKey, hintKey, colorVar }) => `
    <button class="level-card" data-block="${block}" style="--level-color:var(${colorVar})">
      <span class="level-badge">${cefr}</span>
      <span class="level-label">${t(labelKey)}</span>
      <span class="level-hint">${t(hintKey)}</span>
    </button>
  `).join("");

  overlay.innerHTML = `
    <div class="level-modal">
      <button class="level-modal-close" aria-label="Cerrar" type="button">✕</button>
      <h2>${t("level.title")}</h2>
      <p>${t("level.subtitle")}</p>
      <div class="level-cards">${cards}</div>
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target.closest(".level-modal-close") || e.target === overlay) {
      overlay.remove();
      return;
    }
    const card = e.target.closest(".level-card");
    if (!card) return;
    const block = parseInt(card.dataset.block, 10);
    setStartingBlock(block);
    overlay.remove();
    navigate("#/roadmap");
  });

  document.body.appendChild(overlay);
}
