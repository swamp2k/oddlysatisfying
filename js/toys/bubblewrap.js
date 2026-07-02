// Bubble wrap: a sheet of plump bubbles. Click or drag across them to pop.
// When the sheet is fully popped it quietly regrows.

export default {
  id: 'bubblewrap',
  name: 'Bubble Wrap',
  hint: 'drag across the bubbles to pop them',

  init(stage, ui) {
    const { canvas, ctx } = stage;
    const SPACING = 52;
    const RADIUS = 21;

    let bubbles = [];
    let raf = 0;
    let pressed = false;
    let regrowAt = 0;

    function buildSheet() {
      bubbles = [];
      const cols = Math.ceil(stage.width / SPACING);
      const rows = Math.ceil(stage.height / SPACING);
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          // offset every other row for a honeycomb feel
          const x = c * SPACING + (r % 2 ? SPACING / 2 : 0);
          const y = r * SPACING + SPACING / 2;
          bubbles.push({ x, y, popped: false, anim: 0, grow: 1 });
        }
      }
      regrowAt = 0;
    }

    function popAt(x, y) {
      let any = false;
      for (const b of bubbles) {
        if (b.popped || b.grow < 1) continue;
        const dx = b.x - x;
        const dy = b.y - y;
        if (dx * dx + dy * dy < RADIUS * RADIUS) {
          b.popped = true;
          b.anim = 1;
          stage.audio.pop(0.8 + Math.random() * 0.4);
          any = true;
        }
      }
      if (any && bubbles.every((b) => b.popped) && !regrowAt) {
        regrowAt = performance.now() + 1200;
      }
    }

    function onDown(e) {
      pressed = true;
      const p = stage.pointerPos(e);
      popAt(p.x, p.y);
    }
    function onMove(e) {
      if (!pressed) return;
      const p = stage.pointerPos(e);
      popAt(p.x, p.y);
    }
    function onUp() { pressed = false; }

    function draw(now) {
      ctx.clearRect(0, 0, stage.width, stage.height);
      ctx.fillStyle = '#101722';
      ctx.fillRect(0, 0, stage.width, stage.height);

      if (regrowAt && now > regrowAt) {
        for (const b of bubbles) {
          b.popped = false;
          b.grow = 0;
        }
        regrowAt = 0;
      }

      for (const b of bubbles) {
        if (b.grow < 1) b.grow = Math.min(1, b.grow + 0.03 + Math.random() * 0.01);
        if (b.anim > 0) b.anim = Math.max(0, b.anim - 0.08);

        if (b.popped) {
          // deflated ring, with a brief burst flash right after popping
          const flash = b.anim;
          ctx.beginPath();
          ctx.arc(b.x, b.y, RADIUS * (0.55 + flash * 0.6), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(126, 224, 195, ${0.12 + flash * 0.5})`;
          ctx.lineWidth = 1.5 + flash * 2;
          ctx.stroke();
          continue;
        }

        const r = RADIUS * b.grow;
        const grad = ctx.createRadialGradient(
          b.x - r * 0.35, b.y - r * 0.35, r * 0.1,
          b.x, b.y, r,
        );
        grad.addColorStop(0, 'rgba(210, 240, 255, 0.55)');
        grad.addColorStop(0.5, 'rgba(126, 200, 224, 0.22)');
        grad.addColorStop(1, 'rgba(126, 200, 224, 0.08)');
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(160, 220, 240, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }

    ui.addTool('fresh sheet', buildSheet);

    stage.onResize = buildSheet;
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    buildSheet();
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },
};
