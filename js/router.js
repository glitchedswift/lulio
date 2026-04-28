// Tiny hash router. Routes are strings like "#/", "#/roadmap", "#/lesson/:id".
// Patterns use ":name" placeholders; matched values are passed in params.
import { trackPageView } from "./analytics.js";

const routes = [];
let mountEl = null;
let currentCleanup = null;

export function defineRoute(pattern, handler) {
  const keys = [];
  const regex = new RegExp(
    "^#?" +
      pattern.replace(/:[a-zA-Z]+/g, (m) => {
        keys.push(m.slice(1));
        return "([^/]+)";
      }) +
      "$"
  );
  routes.push({ pattern, regex, keys, handler });
}

export function navigate(hash) {
  if (!hash.startsWith("#")) hash = "#" + hash;
  if (location.hash === hash) {
    render();
  } else {
    location.hash = hash;
  }
}

function match(hash) {
  if (!hash || hash === "#") hash = "#/";
  for (const r of routes) {
    const m = hash.match(r.regex);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { handler: r.handler, params };
    }
  }
  return null;
}

async function render() {
  const result = match(location.hash);
  if (!result) {
    location.hash = "#/";
    return;
  }
  if (typeof currentCleanup === "function") {
    try { currentCleanup(); } catch (e) { /* ignore */ }
    currentCleanup = null;
  }
  // View transitions where supported, fallback to plain swap.
  const swap = async () => {
    mountEl.innerHTML = "";
    const cleanup = await result.handler(mountEl, result.params);
    if (typeof cleanup === "function") currentCleanup = cleanup;
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    trackPageView(location.hash.slice(1) || "/");
  };
  if (document.startViewTransition) {
    document.startViewTransition(swap);
  } else {
    await swap();
  }
}

export function startRouter(el) {
  mountEl = el;
  window.addEventListener("hashchange", render);
  render();
}
