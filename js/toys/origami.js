// Origami: a sheet of paper folds itself, one crease at a time, as you
// drag. Each drag flips a flap over the dashed crease line; after six folds
// the paper unfolds itself in reverse and a fresh sheet appears.
//
// The paper is a list of polygons. A fold splits every polygon along the
// crease and reflects the moving half across it; mid-animation, moving
// vertices are interpolated toward their reflection so the flap appears to
// swing over.

const MAX_FOLDS = 6;

export default {
  id: 'origami',
  name: 'Origami',
  hint: 'drag to fold the paper',

  init(stage) {
    const { canvas, ctx } = stage;

    let polys = [];        // { pts, face } — face flips on every fold
    let hue = 0;
    let foldLine = null;   // { x, y, nx, ny }
    let foldCount = 0;
    let progress = 0;
    let mode = 'idle';     // idle | dragging | settling | unfolding | reborn
    let settleTo = 0;
    let history = [];      // snapshots for the unfold: { polys, line }
    let dragStart = null;
    let raf = 0;
    let pauseUntil = 0;

    const front = () => `hsl(${hue}, 62%, 74%)`;
    const back = () => `hsl(${hue}, 48%, 56%)`;

    // ---- geometry helpers -------------------------------------------------
    const side = (v, L) => (v.x - L.x) * L.nx + (v.y - L.y) * L.ny;
    const reflect = (v, L) => {
      const d = side(v, L);
      return { x: v.x - 2 * d * L.nx, y: v.y - 2 * d * L.ny };
    };

    // split polygon into the half with s<=0 (keep) and s>0 (move)
    function split(pts, L) {
      const keep = [];
      const move = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const sa = side(a, L);
        const sb = side(b, L);
        if (sa <= 0) keep.push(a);
        if (sa >= 0) move.push(a);
        if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
          const t = sa / (sa - sb);
          const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
          keep.push(p);
          move.push(p);
        }
      }
      return { keep, move };
    }

    function area(pts) {
      let a = 0;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const q = pts[(i + 1) % pts.length];
        a += p.x * q.y - q.x * p.y;
      }
      return Math.abs(a / 2);
    }

    function bbox() {
      let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
      for (const poly of polys) {
        for (const v of poly.pts) {
          minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
          minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
        }
      }
      return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
    }

    // ---- fold lifecycle ---------------------------------------------------
    function newPaper() {
      const s = Math.min(stage.width, stage.height) * 0.27;
      const cx = stage.width / 2;
      const cy = stage.height / 2;
      hue = Math.random() * 360;
      polys = [{
        pts: [
          { x: cx - s, y: cy - s }, { x: cx + s, y: cy - s },
          { x: cx + s, y: cy + s }, { x: cx - s, y: cy + s },
        ],
        face: true,
      }];
      foldCount = 0;
      history = [];
      progress = 0;
      mode = 'idle';
      pickFoldLine();
    }

    function pickFoldLine() {
      const { cx, cy } = bbox();
      const r2 = Math.SQRT1_2;
      const options = [
        { nx: 1, ny: 0 }, { nx: 0, ny: 1 },
        { nx: r2, ny: r2 }, { nx: r2, ny: -r2 },
      ];
      // shuffle, then take the first crease that actually moves some paper
      options.sort(() => Math.random() - 0.5);
      const total = polys.reduce((s, p) => s + area(p.pts), 0);
      for (const n of options) {
        for (const flip of [1, -1]) {
          const L = { x: cx, y: cy, nx: n.nx * flip, ny: n.ny * flip };
          let moving = 0;
          for (const poly of polys) moving += area(split(poly.pts, L).move);
          if (moving > total * 0.15 && moving < total * 0.85) {
            foldLine = L;
            return;
          }
        }
      }
      foldLine = { x: cx, y: cy, nx: 1, ny: 0 };
    }

    function bakeFold() {
      history.push({ polys: polys.map((p) => ({ pts: p.pts.map((v) => ({ ...v })), face: p.face })), line: foldLine });
      const next = [];
      for (const poly of polys) {
        const { keep, move } = split(poly.pts, foldLine);
        if (keep.length > 2) next.push({ pts: keep, face: poly.face });
        if (move.length > 2) {
          next.push({ pts: move.map((v) => reflect(v, foldLine)).reverse(), face: !poly.face });
        }
      }
      polys = next;
      foldCount++;
      progress = 0;
      stage.audio.pop(0.25);
      if (foldCount >= MAX_FOLDS) {
        mode = 'reborn';
        pauseUntil = performance.now() + 900;
      } else {
        mode = 'idle';
        pickFoldLine();
      }
    }

    // ---- rendering --------------------------------------------------------
    function drawPolys(list, line, p) {
      // keep-side pieces first, then the swinging flap on top
      for (const pass of [0, 1]) {
        for (const poly of list) {
          const moving = line && poly.pts.some((v) => side(v, line) > 0.5);
          if ((pass === 1) !== !!moving) continue;

          ctx.beginPath();
          for (let i = 0; i < poly.pts.length; i++) {
            let v = poly.pts[i];
            if (moving && side(v, line) > 0) {
              const r = reflect(v, line);
              v = { x: v.x + (r.x - v.x) * p, y: v.y + (r.y - v.y) * p };
            }
            if (i === 0) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y);
          }
          ctx.closePath();

          let fill;
          if (moving) {
            // face flips as the flap passes the halfway point
            const flipped = p > 0.5 ? !poly.face : poly.face;
            fill = flipped ? front() : back();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 14 * Math.sin(Math.PI * Math.min(1, p));
          } else {
            fill = poly.face ? front() : back();
            ctx.shadowColor = 'rgba(0,0,0,0.35)';
            ctx.shadowBlur = 8;
          }
          ctx.fillStyle = fill;
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = 'rgba(0,0,0,0.18)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    function drawCreaseHint() {
      const L = foldLine;
      const len = Math.max(stage.width, stage.height);
      // direction along the crease is the normal rotated 90°
      const dx = -L.ny, dy = L.nx;
      ctx.setLineDash([7, 7]);
      ctx.strokeStyle = 'rgba(230, 237, 243, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(L.x - dx * len, L.y - dy * len);
      ctx.lineTo(L.x + dx * len, L.y + dy * len);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function frame(now) {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);

      if (mode === 'settling') {
        progress += (settleTo - progress) * 0.18;
        if (Math.abs(settleTo - progress) < 0.01) {
          progress = settleTo;
          if (settleTo === 1) bakeFold();
          else mode = 'idle';
        }
      } else if (mode === 'reborn' && now > pauseUntil) {
        mode = 'unfolding';
        progress = 1;
      } else if (mode === 'unfolding') {
        if (history.length === 0) {
          newPaper();
        } else {
          progress -= 0.035;
          if (progress <= 0) {
            const snap = history.pop();
            polys = snap.polys;
            progress = 1;
            stage.audio.plink(500 + history.length * 60, 0.05);
          }
        }
      }

      if (mode === 'unfolding' && history.length > 0) {
        const snap = history[history.length - 1];
        drawPolys(snap.polys, snap.line, progress);
      } else if (mode === 'reborn') {
        drawPolys(polys, null, 0);
      } else {
        drawPolys(polys, foldLine, progress);
        if (mode === 'idle' && progress === 0) drawCreaseHint();
      }

      // progress dots: one per completed fold
      for (let i = 0; i < MAX_FOLDS; i++) {
        ctx.beginPath();
        ctx.arc(stage.width / 2 + (i - MAX_FOLDS / 2 + 0.5) * 18, stage.height - 60, 4, 0, Math.PI * 2);
        ctx.fillStyle = i < foldCount ? front() : 'rgba(139,150,165,0.3)';
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    // ---- input ------------------------------------------------------------
    function onDown(e) {
      if (mode !== 'idle') return;
      mode = 'dragging';
      dragStart = stage.pointerPos(e);
    }
    function onMove(e) {
      if (mode !== 'dragging') return;
      const p = stage.pointerPos(e);
      const dist = Math.hypot(p.x - dragStart.x, p.y - dragStart.y);
      progress = Math.max(0, Math.min(1, dist / 200));
    }
    function onUp() {
      if (mode !== 'dragging') return;
      mode = 'settling';
      settleTo = progress > 0.4 ? 1 : 0;
    }

    stage.onResize = newPaper;
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    newPaper();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },
};
