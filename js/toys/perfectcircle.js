// Perfect circle: draw one freehand, get scored against the true circle
// fitted to your stroke. Green where you hugged it, red where you strayed.
// Your best score sticks around in localStorage.

const GRADES = [
  [98, 'suspiciously round'],
  [95, 'unreasonably round'],
  [88, 'smooth operator'],
  [75, 'pretty round'],
  [55, 'roundish'],
  [30, 'more of a vibe than a circle'],
  [0, "that's a potato"],
];

export default {
  id: 'perfectcircle',
  name: 'Perfect Circle',
  hint: 'draw a circle in one stroke',

  init(stage, ui) {
    const { canvas, ctx } = stage;

    let pts = [];
    let drawing = false;
    let result = null; // { cx, cy, r, score, grade }
    let best = parseFloat(localStorage.getItem('oddlysatisfying-best-circle')) || 0;
    let raf = 0;

    function evaluate() {
      if (pts.length < 24) { result = null; return; }
      let cx = 0, cy = 0;
      for (const p of pts) { cx += p.x; cy += p.y; }
      cx /= pts.length;
      cy /= pts.length;

      let r = 0;
      for (const p of pts) r += Math.hypot(p.x - cx, p.y - cy);
      r /= pts.length;
      if (r < 30) { result = null; return; }

      // radial error, normalized by the radius
      let variance = 0;
      for (const p of pts) {
        const d = Math.hypot(p.x - cx, p.y - cy) - r;
        variance += d * d;
      }
      const rmse = Math.sqrt(variance / pts.length) / r;

      // angular coverage: penalize arcs that don't go all the way around
      const angles = pts.map((p) => Math.atan2(p.y - cy, p.x - cx)).sort((a, b) => a - b);
      let maxGap = 2 * Math.PI + angles[0] - angles[angles.length - 1];
      for (let i = 1; i < angles.length; i++) maxGap = Math.max(maxGap, angles[i] - angles[i - 1]);
      const coverage = Math.max(0, 1 - Math.max(0, maxGap - 0.35) / Math.PI);

      const score = Math.max(0, Math.min(100, (100 - rmse * 320) * coverage));
      const grade = GRADES.find(([min]) => score >= min)[1];
      result = { cx, cy, r, score, grade };

      if (score > best) {
        best = score;
        localStorage.setItem('oddlysatisfying-best-circle', String(best));
      }
      stage.audio.plink(200 + score * 5, 0.12);
    }

    function frame() {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);

      // faint center dot to orbit around
      ctx.beginPath();
      ctx.arc(stage.width / 2, stage.height / 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139, 150, 165, 0.5)';
      ctx.fill();

      if (result) {
        // ideal circle
        ctx.beginPath();
        ctx.arc(result.cx, result.cy, result.r, 0, Math.PI * 2);
        ctx.setLineDash([6, 8]);
        ctx.strokeStyle = 'rgba(139, 150, 165, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // the stroke, colored by deviation once scored
      if (pts.length > 1) {
        for (let i = 1; i < pts.length; i++) {
          if (result) {
            const d = Math.abs(Math.hypot(pts[i].x - result.cx, pts[i].y - result.cy) - result.r);
            const err = Math.min(1, d / (result.r * 0.18));
            ctx.strokeStyle = `hsl(${140 - err * 140}, 75%, 60%)`;
          } else {
            ctx.strokeStyle = '#e6edf3';
          }
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
          ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
      }

      if (result) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e6edf3';
        ctx.font = '700 64px ui-rounded, system-ui, sans-serif';
        ctx.fillText(`${result.score.toFixed(1)}%`, stage.width / 2, stage.height / 2 - 8);
        ctx.font = '600 20px ui-rounded, system-ui, sans-serif';
        ctx.fillStyle = '#8b96a5';
        ctx.fillText(result.grade, stage.width / 2, stage.height / 2 + 26);
      } else if (!drawing && pts.length > 0) {
        ctx.textAlign = 'center';
        ctx.font = '600 20px ui-rounded, system-ui, sans-serif';
        ctx.fillStyle = '#8b96a5';
        ctx.fillText('keep going — a whole circle in one stroke', stage.width / 2, stage.height / 2);
      }

      if (best > 0) {
        ctx.textAlign = 'right';
        ctx.font = '600 14px ui-rounded, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(126, 224, 195, 0.7)';
        ctx.fillText(`best: ${best.toFixed(1)}%`, stage.width - 16, 26);
      }

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      drawing = true;
      result = null;
      pts = [stage.pointerPos(e)];
    }
    function onMove(e) {
      if (!drawing) return;
      const p = stage.pointerPos(e);
      const lastP = pts[pts.length - 1];
      if (Math.hypot(p.x - lastP.x, p.y - lastP.y) > 3) pts.push(p);
    }
    function onUp() {
      if (!drawing) return;
      drawing = false;
      evaluate();
    }

    ui.addTool('clear', () => { pts = []; result = null; });

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
