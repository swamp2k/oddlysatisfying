// Honey drizzle: hold to pour a glossy amber stream from the cursor. It
// pools where it lands and slowly slumps sideways like real honey, so you
// can draw with the pile. The drain button lets it all ooze away.

export default {
  id: 'honey',
  name: 'Honey Drizzle',
  hint: 'hold to drizzle · draw with the pile',

  init(stage, ui) {
    const { canvas, ctx } = stage;
    const COL = 3; // px per height column

    let heights = null; // honey pile height per column, in px from the bottom
    let cols = 0;
    let pouring = false;
    let draining = false;
    let pointer = { x: 0, y: 0 };
    let raf = 0;
    let wob = 0;

    function rebuild() {
      cols = Math.ceil(stage.width / COL) + 1;
      heights = new Float32Array(cols);
    }

    function surfaceY(i) {
      return stage.height - heights[Math.max(0, Math.min(cols - 1, i))];
    }

    function pour() {
      const ci = Math.round(pointer.x / COL);
      for (let d = -3; d <= 3; d++) {
        const i = ci + d;
        if (i < 0 || i >= cols) continue;
        heights[i] += 2.2 * Math.exp(-(d * d) / 4);
      }
    }

    function slump() {
      // viscous flow: pairwise transfer proportional to the height difference
      for (const dir of [1, -1]) {
        const start = dir === 1 ? 0 : cols - 2;
        for (let n = 0; n < cols - 1; n++) {
          const i = dir === 1 ? start + n : start - n;
          const d = heights[i] - heights[i + 1];
          const t = d * 0.05;
          heights[i] -= t;
          heights[i + 1] += t;
        }
      }
      if (draining) {
        let total = 0;
        for (let i = 0; i < cols; i++) {
          heights[i] *= 0.965;
          total += heights[i];
        }
        if (total < cols * 0.05) {
          heights.fill(0);
          draining = false;
        }
      }
    }

    function frame() {
      wob += 0.15;
      if (pouring) pour();
      slump();

      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);

      // the pile
      const grad = ctx.createLinearGradient(0, stage.height * 0.4, 0, stage.height);
      grad.addColorStop(0, '#ffbe45');
      grad.addColorStop(0.6, '#e89a1f');
      grad.addColorStop(1, '#a35f05');
      ctx.beginPath();
      ctx.moveTo(0, stage.height);
      for (let i = 0; i < cols; i++) ctx.lineTo(i * COL, surfaceY(i));
      ctx.lineTo(stage.width, stage.height);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // glossy line along the surface
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < cols; i++) {
        if (heights[i] < 1.5) { started = false; continue; }
        const y = surfaceY(i) + 2.5;
        if (!started) { ctx.moveTo(i * COL, y); started = true; }
        else ctx.lineTo(i * COL, y);
      }
      ctx.strokeStyle = 'rgba(255, 235, 190, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // the falling stream, from nozzle to the pile surface
      if (pouring) {
        const ci = Math.round(pointer.x / COL);
        const landY = surfaceY(ci);
        if (landY > pointer.y) {
          const sway = Math.sin(wob) * 2.5;
          const g2 = ctx.createLinearGradient(0, pointer.y, 0, landY);
          g2.addColorStop(0, '#ffce6b');
          g2.addColorStop(1, '#e89a1f');
          ctx.beginPath();
          ctx.moveTo(pointer.x - 5, pointer.y);
          ctx.bezierCurveTo(
            pointer.x - 3 + sway, (pointer.y + landY) / 2,
            pointer.x - 2 + sway, landY,
            pointer.x - 2, landY,
          );
          ctx.lineTo(pointer.x + 2, landY);
          ctx.bezierCurveTo(
            pointer.x + 2 + sway, landY,
            pointer.x + 3 + sway, (pointer.y + landY) / 2,
            pointer.x + 5, pointer.y,
          );
          ctx.closePath();
          ctx.fillStyle = g2;
          ctx.fill();
          // splash bulge where it lands
          ctx.beginPath();
          ctx.ellipse(pointer.x, landY, 9, 4, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#f0a92e';
          ctx.fill();
        }
        // nozzle dot
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffce6b';
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) { pouring = true; pointer = stage.pointerPos(e); }
    function onMove(e) { pointer = stage.pointerPos(e); }
    function onUp() { pouring = false; }

    ui.addTool('drain', () => { draining = true; });

    stage.onResize = rebuild;
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

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
