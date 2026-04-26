// Web Speech API wrapper. Picks a Catalan voice if available, otherwise falls back.

let voices = [];
let warned = false;

function loadVoices() {
  if (!("speechSynthesis" in window)) return [];
  voices = window.speechSynthesis.getVoices() || [];
  return voices;
}

if ("speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice(lang) {
  if (!voices.length) loadVoices();
  // Try exact match (e.g. "ca-ES"), then prefix ("ca"), then any voice.
  let v = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(lang.toLowerCase()));
  if (v) return v;
  if (lang.startsWith("ca")) {
    v = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("es"));
    if (v && !warned) {
      warned = true;
      console.info("Lulio: no Catalan TTS voice found; using Spanish as fallback.");
    }
    return v;
  }
  return null;
}

export function speak(text, lang = "ca-ES") {
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.lang = lang;
    u.rate = 0.95;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  } catch (e) {
    /* ignore */
  }
}

export function hasCatalanVoice() {
  if (!voices.length) loadVoices();
  return voices.some((v) => v.lang && v.lang.toLowerCase().startsWith("ca"));
}
