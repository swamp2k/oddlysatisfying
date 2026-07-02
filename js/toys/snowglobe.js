// Snow globe: a little cabin in the woods under glass. Drag inside the
// globe (or hit shake) to stir the snow, then watch it settle again.

export default {
  id: 'snowglobe',
  name: 'Snow Globe',
  hint: 'drag inside the globe to stir the snow',

  init(stage, ui) {
    const { canvas, ctx } = stage;
    const COUNT = 320;

    let flakes = [];
    let raf = 0;
    let pressed = false;
    let prevP = null;
    let geo = null; // globe geometry, rebuilt on resize

    function rebuild() {
      const R = Math.min(stage.width, stage.height) * 0.36;
      geo = {
        cx: stage.width / 2,
        cy: stage.height * 0.44,
        R,
        groundY: stage.height * 0.44 + R * 0.55,
      };
      flakes = [];
      for (let i = 0; i < COUNT; i++) flakes.push(makeFlake(true));
    }

    function makeFlake(anywhere) {
      const { cx, cy, R } = geo;
      let x, y;
      do {
        x = cx + (Math.random() * 2 - 1) * R;
        y = cy + (Math.random() * 2 - 1) * R;
      } while (Math.hypot(x - cx, y - cy) > R - 6 || (!anywhere && y > geo.groundY));
      return {
        x, y,
        vx: 0, vy: 0,
        r: 1 + Math.random() * 2,
        drift: Math.random() * Math.PI * 2,
      };
    }

    function shake(strength) {
      for (const f of flakes) {
        f.vx += (Math.random() - 0.5) * strength;
        f.vy -= Math.random() * strength * 0.8;
      }
      stage.audio.pop(0.25);
    }

    function stir(p, vx, vy) {
      for (const f of flakes) {
        const d = Math.hypot(f.x - p.x, f.y - p.y);
        if (d < 130) {
          const k = (1 - d / 130) * 0.35;
          f.vx += vx * k;
          f.vy += vy * k;
        }
      }
    }

    function drawScene() {
      const { cx, cy, R, groundY } = geo;

      // pedestal base
      ctx.fillStyle = '#5d4037';
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.7, cy + R * 0.92);
      ctx.lineTo(cx + R * 0.7, cy + R * 0.92);
      ctx.lineTo(cx + R * 0.85, cy + R * 1.15);
      ctx.lineTo(cx - R * 0.85, cy + R * 1.15);
      ctx.closePath();
      ctx.fill();

      // glass interior
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      const sky = ctx.createLinearGradient(0, cy - R, 0, cy + R);
      sky.addColorStop(0, '#1a2740');
      sky.addColorStop(1, '#2c3e5e');
      ctx.fillStyle = sky;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // snowy ground
      ctx.fillStyle = '#e8eef5';
      ctx.beginPath();
      ctx.ellipse(cx, groundY + R * 0.35, R * 1.1, R * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // pines
      for (const [ox, s] of [[-0.55, 0.8], [0.45, 1], [0.62, 0.6]]) {
        const bx = cx + R * ox;
        const size = R * 0.28 * s;
        ctx.fillStyle = '#1d4d3a';
        for (let tier = 0; tier < 3; tier++) {
          const ty = groundY - tier * size * 0.42;
          const tw = size * (1 - tier * 0.22);
          ctx.beginPath();
          ctx.moveTo(bx, ty - size * 0.75);
          ctx.lineTo(bx - tw / 2, ty);
          ctx.lineTo(bx + tw / 2, ty);
          ctx.closePath();
          ctx.fill();
        }
      }

      // cabin
      const cw = R * 0.42;
      const ch = R * 0.3;
      const bx = cx - cw / 2;
      const by = groundY - ch;
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(bx, by, cw, ch);
      ctx.fillStyle = '#b71c1c';
      ctx.beginPath();
      ctx.moveTo(bx - cw * 0.12, by);
      ctx.lineTo(bx + cw / 2, by - ch * 0.7);
      ctx.lineTo(bx + cw * 1.12, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd54f'; // warm window
      ctx.fillRect(bx + cw * 0.6, by + ch * 0.3, cw * 0.22, ch * 0.35);

      // snow
      ctx.fillStyle = '#ffffff';
      for (const f of flakes) {
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // glass rim + highlight
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200, 225, 255, 0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - R * 0.35, cy - R * 0.35, R * 0.5, Math.PI * 1.05, Math.PI * 1.55);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = R * 0.06;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    function frame() {
      const { cx, cy, R, groundY } = geo;
      for (const f of flakes) {
        f.drift += 0.02;
        f.vy += 14 * 0.016;                 // gentle gravity
        f.vx += Math.sin(f.drift) * 0.6 * 0.016; // wander
        f.vx *= 0.985;
        f.vy *= 0.985;
        f.x += f.vx;
        f.y += f.vy;

        // keep inside the glass
        const dx = f.x - cx;
        const dy = f.y - cy;
        const d = Math.hypot(dx, dy);
        if (d > R - 5) {
          f.x = cx + (dx / d) * (R - 5);
          f.y = cy + (dy / d) * (R - 5);
          f.vx *= -0.3;
          f.vy *= -0.3;
        }
        // settle on the ground
        if (f.y > groundY + f.drift % 6 && Math.abs(f.vy) < 40) {
          f.y = Math.min(f.y, groundY + 6);
          f.vx *= 0.8;
          f.vy = 0;
        }
      }

      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);
      drawScene();
      raf = requestAnimationFrame(frame);
    }

    function onDown(e) { pressed = true; prevP = stage.pointerPos(e); }
    function onMove(e) {
      if (!pressed) return;
      const p = stage.pointerPos(e);
      stir(p, (p.x - prevP.x) * 6, (p.y - prevP.y) * 6);
      prevP = p;
    }
    function onUp() { pressed = false; }

    ui.addTool('shake!', () => shake(420));

    stage.onResize = rebuild;
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    rebuild();
    shake(260); // arrive mid-flurry
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },
};
