// Tiny synthesized sound effects — no audio files, everything is generated
// with the Web Audio API on the fly.

let ctx = null;
let muted = false;

function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(value) { muted = value; }
export function isMuted() { return muted; }

// Short filtered noise burst — the bubble-wrap pop.
export function pop(intensity = 1) {
  if (muted) return;
  const ac = ensureCtx();
  const dur = 0.07;
  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;

  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 400 + Math.random() * 900;
  filter.Q.value = 1.2;

  const gain = ac.createGain();
  gain.gain.value = 0.35 * intensity;

  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

// Continuous filtered-noise hiss for spraying. Returns a handle whose
// stop() fades the sound out.
export function spray() {
  if (muted) return { stop() {} };
  const ac = ensureCtx();
  const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2600;
  filter.Q.value = 0.6;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.06, ac.currentTime + 0.08);

  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
  return {
    stop() {
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.15);
      src.stop(ac.currentTime + 0.2);
    },
  };
}

// Soft sine pluck — used for water drops and pendulum ticks.
export function plink(freq = 440, volume = 0.12) {
  if (muted) return;
  const ac = ensureCtx();
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const gain = ac.createGain();
  const now = ac.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.4);
}
