// Tiny sound effects via Web Audio API. No files, no library — synthesized tones.

let ctx = null;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // Safari iOS often suspends until a user gesture; resume opportunistically.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, duration, { type = "sine", vol = 0.18, delay = 0 } = {}) {
  const c = ensureCtx();
  if (!c) return;
  const start = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playCorrect() {
  // Bright two-note rise.
  tone(660, 0.12, { type: "triangle", vol: 0.18 });
  tone(990, 0.18, { type: "triangle", vol: 0.18, delay: 0.09 });
}

export function playWrong() {
  // Soft low buzz, two notes descending.
  tone(220, 0.16, { type: "square", vol: 0.10 });
  tone(165, 0.22, { type: "square", vol: 0.10, delay: 0.12 });
}
