// Fruit slicer: fruit lobs up from the bottom, your pointer leaves a blade
// trail, and a fast swipe cuts fruit into spinning halves with a juice
// splash. No score, no bombs — you can't lose, you can only slice.

const FRUITS = [
  { r: 34, skin: '#2e7d32', flesh: '#ef5350' }, // watermelon
  { r: 26, skin: '#fb8c00', flesh: '#ffcc80' }, // orange
  { r: 23, skin: '#fdd835', flesh: '#fff59d' }, // lemon
  { r: 21, skin: '#7b1fa2', flesh: '#ce93d8' }, // plum
  { r: 25, skin: '#c62828', flesh: '#fff3e0' }, // apple
  { r: 23, skin: '#6d4c41', flesh: '#8bc34a' }, // kiwi
];
const G = 1400; // px/s²

export default {
  id: 'fruitslicer',
  name: 'Fruit Slicer',
  hint: 'swipe fast through the fruit',

  init(stage) {
    const { canvas, ctx } = stage;

    let fruits = [];   // whole fruit in flight
    let halves = [];   // sliced pieces
    let juice = [];    // splash particles
    let trail = [];    // recent pointer points
    let raf = 0;
    let last = performance.now();
    let nextSpawn = 0.4;
    let pressed = false;
    let prevP = null;

    function spawn() {
      const type = FRUITS[(Math.random() * FRUITS.length) | 0];
      const x = stage.width * (0.15 + Math.random() * 0.7);
      const peak = stage.height * (0.55 + Math.random() * 0.3);
      fruits.push({
        ...type,
        x,
        y: stage.height + type.r,
        vx: (stage.width / 2 - x) * (0.2 + Math.random() * 0.4),
        vy: -Math.sqrt(2 * G * peak),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 4,
      });
    }

    function sliceSegment(a, b) {
      const speed = Math.hypot(b.x - a.x, b.y - a.y);
      if (speed < 10) return;
      for (let i = fruits.length - 1; i >= 0; i--) {
        const f = fruits[i];
        if (segCircleDist(a, b, f) > f.r) continue;
        fruits.splice(i, 1);
        const cut = Math.atan2(b.y - a.y, b.x - a.x);
        for (const side of [-1, 1]) {
          halves.push({
            ...f,
            cut,
            vx: f.vx + Math.cos(cut + Math.PI / 2) * side * 160,
            vy: f.vy * 0.5 + Math.sin(cut + Math.PI / 2) * side * 160 - 60,
            vr: side * (2 + Math.random() * 3),
          });
        }
        for (let j = 0; j < 16; j++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 80 + Math.random() * 260;
          juice.push({
            x: f.x, y: f.y,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp - 80,
            r: 2 + Math.random() * 3,
            color: f.flesh,
            life: 0.7,
          });
        }
        stage.audio.pop(1.1);
        stage.audio.plink(160 + Math.random() * 120, 0.1);
      }
    }

    function segCircleDist(a, b, c) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / len2));
      return Math.hypot(c.x - (a.x + dx * t), c.y - (a.y + dy * t));
    }

    function drawWhole(f) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.beginPath();
      ctx.arc(0, 0, f.r, 0, Math.PI * 2);
      ctx.fillStyle = f.skin;
      ctx.fill();
      // glossy highlight
      ctx.beginPath();
      ctx.arc(-f.r * 0.3, -f.r * 0.3, f.r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fill();
      ctx.restore();
    }

    function drawHalf(f) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.beginPath();
      ctx.arc(0, 0, f.r, f.cut, f.cut + Math.PI);
      ctx.closePath();
      ctx.fillStyle = f.flesh;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, f.r - 2, f.cut, f.cut + Math.PI);
      ctx.strokeStyle = f.skin;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
    }

    function frame(now) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);

      nextSpawn -= dt;
      if (nextSpawn <= 0) {
        spawn();
        if (Math.random() < 0.3) spawn(); // occasional double toss
        nextSpawn = 0.8 + Math.random() * 0.9;
      }

      for (const list of [fruits, halves]) {
        for (let i = list.length - 1; i >= 0; i--) {
          const f = list[i];
          f.vy += G * dt;
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          f.rot += f.vr * dt;
          if (f.y > stage.height + f.r * 2 && f.vy > 0) list.splice(i, 1);
        }
      }
      for (const f of fruits) drawWhole(f);
      for (const f of halves) drawHalf(f);

      for (let i = juice.length - 1; i >= 0; i--) {
        const p = juice[i];
        p.vy += G * 0.6 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) { juice.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // blade trail: fading tapered streak
      trail = trail.filter((p) => now - p.t < 140);
      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
          const age = 1 - (now - trail[i].t) / 140;
          ctx.strokeStyle = `rgba(190, 235, 255, ${age * 0.9})`;
          ctx.lineWidth = 1 + age * 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      pressed = true;
      prevP = stage.pointerPos(e);
      trail.push({ ...prevP, t: performance.now() });
    }
    function onMove(e) {
      if (!pressed) return;
      const p = stage.pointerPos(e);
      trail.push({ ...p, t: performance.now() });
      sliceSegment(prevP, p);
      prevP = p;
    }
    function onUp() { pressed = false; prevP = null; }

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },
};
