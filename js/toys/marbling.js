// Paint marbling: real paper-marbling math. Tap to drop a blob of paint —
// every earlier blob is pushed aside exactly as incompressible fluid would
// be — then drag a stylus through the bath to comb the colors into swirls.

const PALETTE = ['#f2e8d5', '#d96c47', '#3f7f7a', '#274060', '#e3b23c', '#c96d8f', '#7ea16b'];
const VERTS = 80;

export default {
  id: 'marbling',
  name: 'Paint Marbling',
  hint: 'tap to drop paint · drag to comb it',

  init(stage, ui) {
    const { canvas, ctx } = stage;

    let drops = [];   // { pts: [{x,y}...], color }
    let raf = 0;
    let pressed = false;
    let moved = false;
    let downP = null;
    let prevP = null;

    // Ink-drop displacement: points move radially so the new drop's area is
    // exactly made room for (Lord Rayleigh via the marbling literature).
    function addDrop(cx, cy, r, color) {
      for (const d of drops) {
        for (const p of d.pts) {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist2 = dx * dx + dy * dy || 1e-6;
          const k = Math.sqrt(1 + (r * r) / dist2);
          p.x = cx + dx * k;
          p.y = cy + dy * k;
        }
      }
      const pts = [];
      for (let i = 0; i < VERTS; i++) {
        const a = (i / VERTS) * Math.PI * 2;
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }
      drops.push({ pts, color });
      if (drops.length > 160) drops.shift();
      stage.audio.plink(240 + Math.random() * 200, 0.06);
    }

    // Tine stroke: everything is dragged along the stylus line, with the
    // pull falling off with distance from it.
    function tine(a, b) {
      const ux = b.x - a.x;
      const uy = b.y - a.y;
      const len = Math.hypot(ux, uy);
      if (len < 1) return;
      const nx = -uy / len;
      const ny = ux / len;
      const z = Math.min(len, 24) * 0.55;
      const sharp = 26; // falloff distance
      for (const d of drops) {
        for (const p of d.pts) {
          const dist = Math.abs((p.x - a.x) * nx + (p.y - a.y) * ny);
          const pull = z * Math.pow(sharp / (sharp + dist), 1.7);
          p.x += (ux / len) * pull;
          p.y += (uy / len) * pull;
        }
      }
    }

    function randomDrops(n) {
      for (let i = 0; i < n; i++) {
        addDrop(
          stage.width * (0.2 + Math.random() * 0.6),
          stage.height * (0.2 + Math.random() * 0.6),
          18 + Math.random() * 42,
          PALETTE[(Math.random() * PALETTE.length) | 0],
        );
      }
    }

    function frame() {
      ctx.fillStyle = '#141a26'; // the bath
      ctx.fillRect(0, 0, stage.width, stage.height);

      for (const d of drops) {
        ctx.beginPath();
        ctx.moveTo(d.pts[0].x, d.pts[0].y);
        for (let i = 1; i < d.pts.length; i++) ctx.lineTo(d.pts[i].x, d.pts[i].y);
        ctx.closePath();
        ctx.fillStyle = d.color;
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      pressed = true;
      moved = false;
      downP = stage.pointerPos(e);
      prevP = downP;
    }
    function onMove(e) {
      if (!pressed) return;
      const p = stage.pointerPos(e);
      if (Math.hypot(p.x - downP.x, p.y - downP.y) > 6) moved = true;
      if (moved) {
        tine(prevP, p);
        prevP = p;
      }
    }
    function onUp() {
      if (!pressed) return;
      pressed = false;
      if (!moved && downP) {
        addDrop(downP.x, downP.y, 16 + Math.random() * 40, PALETTE[(Math.random() * PALETTE.length) | 0]);
      }
    }

    ui.addTool('more paint', () => randomDrops(6));
    ui.addTool('clear bath', () => { drops = []; });

    stage.onResize = () => {};
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    randomDrops(9);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },
};
