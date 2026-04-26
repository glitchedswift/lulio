// Cookie-backed app state. Uses js-cookie (loaded via CDN as window.Cookies).

const COOKIE_OPTS = { expires: 365 * 5, sameSite: "lax", path: "/" };
const C_LANG = "lulio_lang";
const C_PROGRESS = "lulio_progress";
const C_XP = "lulio_xp";

const listeners = new Set();

const _state = {
  lang: "es",
  progress: {},
  xp: 0,
};

function readCookie(name) {
  try {
    const raw = window.Cookies.get(name);
    return raw ? raw : null;
  } catch (e) {
    return null;
  }
}

function readJsonCookie(name, fallback) {
  const raw = readCookie(name);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function writeCookie(name, value) {
  try {
    window.Cookies.set(name, typeof value === "string" ? value : JSON.stringify(value), COOKIE_OPTS);
  } catch (e) { /* ignore */ }
}

export function loadState() {
  const lang = readCookie(C_LANG);
  if (lang === "es" || lang === "ca") _state.lang = lang;
  _state.progress = readJsonCookie(C_PROGRESS, {});
  const xp = parseInt(readCookie(C_XP) || "0", 10);
  _state.xp = Number.isFinite(xp) ? xp : 0;
  notify();
}

export function getState() {
  return _state;
}

export function setLang(lang) {
  if (lang !== "es" && lang !== "ca") return;
  _state.lang = lang;
  writeCookie(C_LANG, lang);
  document.documentElement.setAttribute("lang", lang === "ca" ? "ca" : "es");
  notify();
}

export function getLang() {
  return _state.lang;
}

export function getLessonProgress(lessonId) {
  return _state.progress[lessonId] || { topicsCompleted: [], extrasCompleted: [], completedAt: null };
}

export function isLessonComplete(lessonId, totalTopics) {
  const p = getLessonProgress(lessonId);
  return p.topicsCompleted.length >= totalTopics;
}

export function markTopicComplete(lessonId, topicId, isExtra, gainedXp) {
  const p = getLessonProgress(lessonId);
  const key = isExtra ? "extrasCompleted" : "topicsCompleted";
  if (!p[key].includes(topicId)) {
    p[key] = [...p[key], topicId];
  }
  _state.progress[lessonId] = p;
  if (gainedXp) {
    _state.xp += gainedXp;
    writeCookie(C_XP, String(_state.xp));
  }
  writeCookie(C_PROGRESS, _state.progress);
  notify();
}

export function markLessonComplete(lessonId) {
  const p = getLessonProgress(lessonId);
  if (!p.completedAt) p.completedAt = new Date().toISOString();
  _state.progress[lessonId] = p;
  writeCookie(C_PROGRESS, _state.progress);
  notify();
}

export function totalLessonsCompleted() {
  return Object.values(_state.progress).filter((p) => p.completedAt).length;
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) {
    try { fn(_state); } catch (e) { /* ignore */ }
  }
}
