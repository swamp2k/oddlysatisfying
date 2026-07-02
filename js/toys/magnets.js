// Magnet snap: loose shapes on a dot grid. Drag one and it visibly *wants*
// to align — leaning toward the nearest free cell, then springing home with
// a wobble and a click when you let go.

const COLORS = ['#7ee0c3', '#f6a5c0', '#f9d976', '#9bb8ff', '#c39bff', '#ffb28a'];
const KINDS = ['square', 'circle', 'triangle', 'diamond'];

export default {
  id: 'magnets',
  name: 'Magnet Snap',
  hint: 'drag a shape — it wants to line up',

  init(stage, ui) {
    const { canvas, ctx } = stage;
    const GAP = 92;
    const SIZE = 30;

    let shapes = [];
    let grid = null; // occupancy: "col,row" -> shape
    let dragging = null;
    let grabOff = { x: 0, y: 0 };
    let raf = 0;

    function cellAt(x, y) {
      return {
        c: Math.round((x - stage.width / 2) / GAP),
        r: Math.round((y - stage.height / 2) / GAP),
      };
    }
    function cellPos(c, r) {
      return { x: stage.width / 2 + c * GAP, y: stage.height / 2 + r * GAP };
    }

    function nearestFreeCell(x, y, self) {
      const base = cellAt(x, y);
      let best = null;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const c = base.c + dc;
          const r = base.r + dr;
          const key = `${c},${r}`;
          if (grid.get(key) && grid.get(key) !== self) continue;
          const p = cellPos(c, r);
          if (p.x < SIZE || p.x > stage.width - SIZE || p.y < SIZE || p.y > stage.height - SIZE) continue;
          const d = Math.hypot(p.x - x, p.y - y);
          if (!best || d < best.d) best = { c, r, x: p.x, y: p.y, d };
        }
      }
      return best;
    }

    function scatter() {
      shapes = [];
      grid = new Map();
      for (let i = 0; i < 8; i++) {
        const s = {
          kind: KINDS[i % KINDS.length],
          color: COLORS[i % COLORS.length],
          x: stage.width * (0.15 + Math.random() * 0.7),
          y: stage.height * (0.15 + Math.random() * 0.7),
          vx: 0, vy: 0,
          target: null,
          settled: false,
          key: null,
        };
        shapes.push(s);
      }
    }

    function release(s) {
      const cell = nearestFreeCell(s.x, s.y, s);
      if (!cell) return;
      if (s.key) grid.delete(s.key);
      s.key = `${cell.c},${cell.r}`;
      grid.set(s.key, s);
      s.target = cell;
      s.settled = false;
    }

    function drawShape(s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.fillStyle = s.color;
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      const h = SIZE / 2;
      if (s.kind === 'square') {
        ctx.roundRect(-h, -h, SIZE, SIZE, 7);
      } else if (s.kind === 'circle') {
        ctx.arc(0, 0, h, 0, Math.PI * 2);
      } else if (s.kind === 'triangle') {
        ctx.moveTo(0, -h);
        ctx.lineTo(h, h * 0.85);
        ctx.lineTo(-h, h * 0.85);
        ctx.closePath();
      } else {
        ctx.moveTo(0, -h * 1.15);
        ctx.lineTo(h * 1.15, 0);
        ctx.lineTo(0, h * 1.15);
        ctx.lineTo(-h * 1.15, 0);
        ctx.closePath();
      }
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.ellipse(-h * 0.3, -h * 0.35, h * 0.4, h * 0.25, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);

      // dot grid
      ctx.fillStyle = 'rgba(139, 150, 165, 0.22)';
      const c0 = cellAt(0, 0);
      const c1 = cellAt(stage.width, stage.height);
      for (let r = c0.r; r <= c1.r; r++) {
        for (let c = c0.c; c <= c1.c; c++) {
          const p = cellPos(c, r);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ghost outline of where the dragged shape wants to go
      if (dragging) {
        const cell = nearestFreeCell(dragging.x, dragging.y, dragging);
        if (cell) {
          ctx.beginPath();
          ctx.arc(cell.x, cell.y, SIZE * 0.75, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(126, 224, 195, 0.4)';
          ctx.setLineDash([4, 5]);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      for (const s of shapes) {
        if (s !== dragging && s.target && !s.settled) {
          // underdamped spring: overshoot then wobble into place
          s.vx += (s.target.x - s.x) * 0.16;
          s.vy += (s.target.y - s.y) * 0.16;
          s.vx *= 0.78;
          s.vy *= 0.78;
          s.x += s.vx;
          s.y += s.vy;
          const d = Math.hypot(s.target.x - s.x, s.target.y - s.y);
          if (d < 0.5 && Math.hypot(s.vx, s.vy) < 0.5) {
            s.x = s.target.x;
            s.y = s.target.y;
            s.settled = true;
            stage.audio.plink(340 + Math.random() * 60, 0.14);
          }
        }
        drawShape(s);
      }

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      const p = stage.pointerPos(e);
      for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (Math.hypot(s.x - p.x, s.y - p.y) < SIZE * 0.9) {
          dragging = s;
          grabOff = { x: s.x - p.x, y: s.y - p.y };
          shapes.splice(i, 1);
          shapes.push(s); // draw on top
          if (s.key) { grid.delete(s.key); s.key = null; }
          s.target = null;
          return;
        }
      }
    }
    function onMove(e) {
      if (!dragging) return;
      const p = stage.pointerPos(e);
      let x = p.x + grabOff.x;
      let y = p.y + grabOff.y;
      // magnetic lean: pull toward the nearest cell, stronger as you near it
      const cell = nearestFreeCell(x, y, dragging);
      if (cell && cell.d < 46) {
        const k = (1 - cell.d / 46) * 0.45;
        x += (cell.x - x) * k;
        y += (cell.y - y) * k;
      }
      dragging.x = x;
      dragging.y = y;
    }
    function onUp() {
      if (!dragging) return;
      release(dragging);
      dragging = null;
    }

    ui.addTool('scatter', scatter);
    ui.addTool('snap all', () => {
      for (const s of shapes) if (!s.target) release(s);
    });

    stage.onResize = scatter;
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    scatter();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },
};
