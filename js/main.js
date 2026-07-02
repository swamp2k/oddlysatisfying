import * as audio from './audio.js';
import bubblewrap from './toys/bubblewrap.js';
import sand from './toys/sand.js';
import ripples from './toys/ripples.js';
import pendulumwave from './toys/pendulumwave.js';
import harmonograph from './toys/harmonograph.js';

const toys = [bubblewrap, sand, ripples, pendulumwave, harmonograph];

const canvas = document.getElementById('stage');
const nav = document.getElementById('toy-nav');
const hint = document.getElementById('toy-hint');
const toolbar = document.getElementById('toy-toolbar');
const muteBtn = document.getElementById('mute-btn');

let current = null;      // { toy, cleanup }
let hintTimer = null;

// The stage object handed to every toy. Canvas is sized in device pixels
// with the context pre-scaled, so toys work in CSS-pixel coordinates.
const stage = {
  canvas,
  ctx: canvas.getContext('2d'),
  width: 0,
  height: 0,
  audio,
  onResize: null, // toys may assign a callback
  pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  },
};

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  stage.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  stage.width = rect.width;
  stage.height = rect.height;
  if (stage.onResize) stage.onResize();
}

function showHint(text) {
  hint.textContent = text;
  hint.classList.remove('faded');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hint.classList.add('faded'), 4000);
}

function select(toy) {
  if (current) {
    current.cleanup?.();
    current = null;
  }
  stage.onResize = null;
  toolbar.replaceChildren();
  stage.ctx.setTransform(1, 0, 0, 1, 0, 0);
  stage.ctx.clearRect(0, 0, canvas.width, canvas.height);
  resize();

  for (const btn of nav.children) {
    btn.classList.toggle('active', btn.dataset.id === toy.id);
  }
  showHint(toy.hint);

  const cleanup = toy.init(stage, {
    addTool(label, onClick) {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.addEventListener('click', onClick);
      toolbar.appendChild(btn);
      return btn;
    },
  });
  current = { toy, cleanup };
  location.hash = toy.id;
}

for (const toy of toys) {
  const btn = document.createElement('button');
  btn.textContent = toy.name;
  btn.dataset.id = toy.id;
  btn.addEventListener('click', () => select(toy));
  nav.appendChild(btn);
}

muteBtn.addEventListener('click', () => {
  audio.setMuted(!audio.isMuted());
  muteBtn.classList.toggle('muted', audio.isMuted());
  muteBtn.textContent = audio.isMuted() ? '🔇' : '🔊';
});

window.addEventListener('resize', resize);
resize();

const initial = toys.find((t) => t.id === location.hash.slice(1)) || toys[0];
select(initial);
