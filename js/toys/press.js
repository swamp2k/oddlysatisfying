// Hydraulic press: hold to bring the ram down on whatever's on the plate.
// Things resist, squash wide, and finally give way with a burst. Release to
// retract, and the next victim slides in. Of course.

const THINGS = [
  { name: 'melon', w: 90, h: 80, color: '#2e7d32', burst: '#ef5350' },
  { name: 'can', w: 46, h: 84, color: '#c62828', burst: '#eceff1' },
  { name: 'duck', w: 80, h: 70, color: '#fdd835', burst: '#fdd835' },
  { name: 'jelly', w: 84, h: 62, color: '#66bb6a', burst: '#a5d6a7' },
  { name: 'tomato', w: 70, h: 60, color: '#e53935', burst: '#ff8a65' },
];

export default {
  id: 'press',
  name: 'Hydraulic Press',
  hint: 'hold anywhere to press',

  init(stage, ui) {
    const { canvas, ctx } = stage;

    let thing = null;
    let slideIn = 0;      // 1 → 0 as the object slides in from the right
    let squash = 1;
    let flattened = false;
    let plateY = 0;
    let holding = false;
    let debris = [];
    let raf = 0;
    let lastCreak = 0;

    const floorY = () => stage.height * 0.78;
    const plateTop = () => stage.height * 0.16;

    function nextThing() {
      thing = THINGS[(Math.random() * THINGS.length) | 0];
      squash = 1;
      flattened = false;
      slideIn = 1;
    }

    function crush() {
      flattened = true;
      stage.audio.pop(1.3);
      stage.audio.plink(90, 0.15);
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI;
        const sp = 120 + Math.random() * 380;
        debris.push({
          x: stage.width / 2 + (Math.random() - 0.5) * thing.w,
          y: floorY() - 6,
          vx: Math.cos(a) * sp * (Math.random() < 0.5 ? 1 : -1),
          vy: -Math.abs(Math.sin(a)) * sp,
          r: 2 + Math.random() * 4,
          color: Math.random() < 0.7 ? thing.burst : thing.color,
          life: 1.2,
        });
      }
    }

    function drawThing() {
      const t = thing;
      const cx = stage.width / 2 + slideIn * stage.width * 0.6;
      const s = flattened ? 0.07 : squash;
      const h = t.h * s;
      const w = t.w * (1 + (1 - s) * 0.9);
      const y = floorY();

      ctx.save();
      ctx.translate(cx, y);
      ctx.scale(w / t.w, h / t.h);
      // unit shapes drawn with origin at bottom-center, t.w × t.h
      ctx.fillStyle = t.color;
      if (t.name === 'melon') {
        ctx.beginPath();
        ctx.ellipse(0, -t.h / 2, t.w / 2, t.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 5;
        for (const off of [-0.5, 0, 0.5]) {
          ctx.beginPath();
          ctx.ellipse(0, -t.h / 2, t.w / 2 * Math.abs(Math.cos(off)), t.h / 2, off, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (t.name === 'can') {
        ctx.beginPath();
        ctx.roundRect(-t.w / 2, -t.h, t.w, t.h, 8);
        ctx.fill();
        ctx.fillStyle = '#eceff1';
        ctx.fillRect(-t.w / 2, -t.h * 0.62, t.w, t.h * 0.24);
        ctx.fillStyle = '#b0bec5';
        ctx.fillRect(-t.w / 2, -t.h, t.w, 5);
      } else if (t.name === 'duck') {
        ctx.beginPath();
        ctx.ellipse(0, -t.h * 0.35, t.w / 2, t.h * 0.35, 0, 0, Math.PI * 2); // body
        ctx.fill();
        ctx.beginPath();
        ctx.arc(t.w * 0.22, -t.h * 0.75, t.h * 0.25, 0, Math.PI * 2); // head
        ctx.fill();
        ctx.fillStyle = '#fb8c00';
        ctx.beginPath();
        ctx.ellipse(t.w * 0.45, -t.h * 0.72, t.w * 0.14, t.h * 0.07, 0, 0, Math.PI * 2); // beak
        ctx.fill();
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(t.w * 0.28, -t.h * 0.8, 2.5, 0, Math.PI * 2); // eye
        ctx.fill();
      } else if (t.name === 'jelly') {
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(-t.w / 2, -t.h, t.w, t.h, 16);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.roundRect(-t.w / 2 + 8, -t.h + 6, t.w * 0.4, t.h * 0.3, 8);
        ctx.fill();
      } else { // tomato
        ctx.beginPath();
        ctx.ellipse(0, -t.h / 2, t.w / 2, t.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2e7d32';
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * 8, -t.h + 2, 9, 3.5, a, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function frame(now) {
      // press motion
      const objTop = floorY() - (flattened ? thing.h * 0.07 : thing.h * squash);
      if (holding && slideIn < 0.02) {
        plateY += flattened ? 6 : plateY >= objTop - 1 ? 0.9 : 7;
      } else {
        plateY -= 9;
      }
      plateY = Math.max(plateTop(), Math.min(plateY, floorY() - thing.h * 0.07));

      // squashing
      if (!flattened && plateY >= objTop - 1) {
        squash = Math.max(0.12, (floorY() - plateY) / thing.h);
        if (holding && now - lastCreak > 160) {
          stage.audio.plink(85 + Math.random() * 40, 0.05);
          lastCreak = now;
        }
        if (squash <= 0.13) crush();
      }
      if (slideIn > 0) slideIn = Math.max(0, slideIn - 0.03);
      // once crushed and the ram is back up, bring in the next thing
      if (flattened && plateY <= plateTop() + 1 && !holding) nextThing();

      // ---- draw ----
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);

      const cx = stage.width / 2;
      // frame columns
      ctx.fillStyle = '#2a3444';
      ctx.fillRect(cx - 170, plateTop() - 60, 34, floorY() - plateTop() + 90);
      ctx.fillRect(cx + 136, plateTop() - 60, 34, floorY() - plateTop() + 90);
      ctx.fillRect(cx - 190, plateTop() - 78, 380, 30);
      // base
      ctx.fillStyle = '#38445a';
      ctx.fillRect(cx - 190, floorY(), 380, 26);
      ctx.fillStyle = '#232c3a';
      ctx.fillRect(cx - 210, floorY() + 26, 420, 12);

      drawThing();

      // piston + plate
      ctx.fillStyle = '#4a5872';
      ctx.fillRect(cx - 26, plateTop() - 50, 52, plateY - plateTop() + 50);
      const grad = ctx.createLinearGradient(0, plateY, 0, plateY + 26);
      grad.addColorStop(0, '#7d8ba3');
      grad.addColorStop(1, '#38445a');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - 130, plateY, 260, 26);

      // debris
      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.vy += 1100 * 0.016;
        d.x += d.vx * 0.016;
        d.y += d.vy * 0.016;
        if (d.y > floorY() + 20) { d.y = floorY() + 20; d.vy *= -0.3; d.vx *= 0.8; }
        d.life -= 0.016;
        if (d.life <= 0) { debris.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, d.life);
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    }

    function onDown() { holding = true; }
    function onUp() { holding = false; }

    ui.addTool('next thing', () => { debris = []; nextThing(); });

    stage.onResize = () => { plateY = plateTop(); };
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    plateY = plateTop();
    nextThing();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  },
};
