// Cookie-backed app state. Uses js-cookie (loaded via CDN as window.Cookies).

const COOKIE_OPTS = { expires: 365 * 5, sameSite: "lax", path: "/" };
const C_LANG = "lulio_lang";
const C_PROGRESS = "lulio_progress";
const C_XP = "lulio_xp";
const C_EXAMS = "lulio_exams";
const C_LEVEL = "lulio_level";

const listeners = new Set();

const _state = {
  lang: "es",
  progress: {},
  xp: 0,
  exams: {},
  startingBlock: 0,
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
  _state.exams = readJsonCookie(C_EXAMS, {});
  const lvl = parseInt(readCookie(C_LEVEL) || "0", 10);
  _state.startingBlock = (lvl >= 1 && lvl <= 5) ? lvl : 0;
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

export function addXp(amount) {
  if (!amount) return;
  _state.xp += amount;
  writeCookie(C_XP, String(_state.xp));
  notify();
}

export function isBlockExamPassed(blockId) {
  return !!_state.exams[String(blockId)];
}

export function markBlockExamPassed(blockId) {
  _state.exams[String(blockId)] = true;
  writeCookie(C_EXAMS, _state.exams);
  notify();
}

export function totalLessonsCompleted() {
  return Object.values(_state.progress).filter((p) => p.completedAt).length;
}

export function hasChosenLevel() {
  return _state.startingBlock > 0;
}

export function getStartingBlock() {
  return _state.startingBlock;
}

export function setStartingBlock(block) {
  _state.startingBlock = block;
  writeCookie(C_LEVEL, String(block));
  notify();
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
