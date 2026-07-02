// Glitter jar: a screenful of twinkling glitter suspended in thick liquid.
// Drag to swirl it, shake to send it everywhere, then watch it drift down
// and settle while it sparkles.

const HUES = [46, 46, 46, 330, 180, 270]; // mostly gold, some rose/teal/violet

export default {
  id: 'glitterjar',
  name: 'Glitter Jar',
  hint: 'drag to swirl the glitter',

  init(stage, ui) {
    const { canvas, ctx } = stage;
    const COUNT = 700;

    let flecks = [];
    let raf = 0;
    let pressed = false;
    let prevP = null;
    let t = 0;

    function rebuild() {
      flecks = [];
      for (let i = 0; i < COUNT; i++) {
        flecks.push({
          x: Math.random() * stage.width,
          y: Math.random() * stage.height,
          vx: 0, vy: 0,
          size: 0.8 + Math.random() * 1.8,
          hue: HUES[(Math.random() * HUES.length) | 0] + (Math.random() - 0.5) * 20,
          phase: Math.random() * Math.PI * 2,
          speed: 2 + Math.random() * 5,
        });
      }
      shake(300);
    }

    function shake(strength) {
      for (const f of flecks) {
        f.vx += (Math.random() - 0.5) * strength;
        f.vy += (Math.random() - 0.5) * strength;
      }
    }

    function frame() {
      t += 0.016;
      // translucent fill leaves faint motion streaks
      ctx.fillStyle = 'rgba(13, 17, 23, 0.4)';
      ctx.fillRect(0, 0, stage.width, stage.height);

      for (const f of flecks) {
        // thick liquid: strong drag, slow sink, tiny brownian shimmer
        f.vx = f.vx * 0.94 + (Math.random() - 0.5) * 1.2;
        f.vy = f.vy * 0.94 + 0.35 + (Math.random() - 0.5) * 1.2;
        f.x += f.vx * 0.016 * 60 * 0.16;
        f.y += f.vy * 0.016 * 60 * 0.16;

        if (f.x < 2) { f.x = 2; f.vx *= -0.5; }
        if (f.x > stage.width - 2) { f.x = stage.width - 2; f.vx *= -0.5; }
        if (f.y < 2) { f.y = 2; f.vy *= -0.5; }
        if (f.y > stage.height - 3) { f.y = stage.height - 3; f.vy = 0; f.vx *= 0.9; }

        // sharp twinkle
        const tw = Math.pow((Math.sin(f.phase + t * f.speed) + 1) / 2, 6);
        const bright = 0.25 + tw * 0.75;
        ctx.globalAlpha = bright;
        ctx.fillStyle = `hsl(${f.hue}, 90%, ${55 + tw * 35}%)`;
        ctx.fillRect(f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);

        // the brightest flecks get a little 4-point star
        if (tw > 0.92) {
          ctx.globalAlpha = tw * 0.7;
          ctx.strokeStyle = `hsla(${f.hue}, 100%, 85%, 0.8)`;
          ctx.lineWidth = 0.8;
          const s = f.size * 3.5;
          ctx.beginPath();
          ctx.moveTo(f.x - s, f.y); ctx.lineTo(f.x + s, f.y);
          ctx.moveTo(f.x, f.y - s); ctx.lineTo(f.x, f.y + s);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) { pressed = true; prevP = stage.pointerPos(e); }
    function onMove(e) {
      if (!pressed) return;
      const p = stage.pointerPos(e);
      const vx = (p.x - prevP.x) * 2.2;
      const vy = (p.y - prevP.y) * 2.2;
      for (const f of flecks) {
        const d = Math.hypot(f.x - p.x, f.y - p.y);
        if (d < 150) {
          const k = 1 - d / 150;
          f.vx += vx * k;
          f.vy += vy * k;
        }
      }
      prevP = p;
    }
    function onUp() { pressed = false; }

    ui.addTool('shake!', () => { shake(400); stage.audio.pop(0.3); });

    stage.onResize = rebuild;
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, stage.width, stage.height);
    rebuild();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },
};
