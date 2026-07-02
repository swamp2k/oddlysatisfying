// Dominoes: a spiral of dominoes seen from above. Click one and the wave
// runs down the line, clack after clack, all the way to the center.

export default {
  id: 'dominoes',
  name: 'Dominoes',
  hint: 'tap a domino to start the wave',

  init(stage, ui) {
    const { canvas, ctx } = stage;
    const LEN = 24;   // domino width (perpendicular to the path)
    const FALL_MS = 150;

    let dominoes = []; // { x, y, tan, state: 0 standing | 1 falling | 2 fallen, t0 }
    let raf = 0;

    function buildPath() {
      dominoes = [];
      const cx = stage.width / 2;
      const cy = stage.height / 2;
      const rMax = Math.min(stage.width, stage.height) * 0.44;
      const rMin = 30;
      const turns = 2.6;
      const phase = Math.random() * Math.PI * 2;
      // walk the spiral placing dominoes every ~30px of arc length
      let theta = 0;
      while (theta < turns * 2 * Math.PI) {
        const f = theta / (turns * 2 * Math.PI);
        const r = rMax - (rMax - rMin) * f;
        const a = theta + phase;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        // tangent pointing inward along the spiral
        const tan = a + Math.PI / 2 + 0.08;
        dominoes.push({ x, y, tan, state: 0, t0: 0 });
        theta += 30 / r;
      }
    }

    function reset() {
      for (const d of dominoes) { d.state = 0; d.t0 = 0; }
    }

    function topple(index, now) {
      const d = dominoes[index];
      if (!d || d.state !== 0) return;
      d.state = 1;
      d.t0 = now;
    }

    function frame(now) {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);

      for (let idx = 0; idx < dominoes.length; idx++) {
        const d = dominoes[idx];
        let p = 0;
        if (d.state === 1) {
          p = Math.min(1, (now - d.t0) / FALL_MS);
          if (p > 0.55 && dominoes[idx + 1] && dominoes[idx + 1].state === 0) {
            topple(idx + 1, now);
            if (idx % 2 === 0) stage.audio.pop(0.35);
          }
          if (p >= 1) d.state = 2;
        } else if (d.state === 2) {
          p = 1;
        }

        // top-down: standing is a thin bar; falling stretches forward
        // along the tangent as the domino lies down
        const depth = 5 + p * 24;          // thickness grows to full height
        const shift = (depth - 5) / 2;     // center moves forward as it falls
        const hue = 165 + (idx / dominoes.length) * 140;

        ctx.save();
        ctx.translate(d.x + Math.cos(d.tan) * shift, d.y + Math.sin(d.tan) * shift);
        ctx.rotate(d.tan);
        if (p === 0) {
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 3;
        }
        ctx.fillStyle = `hsl(${hue}, ${70 - p * 25}%, ${62 - p * 22}%)`;
        ctx.beginPath();
        ctx.roundRect(-depth / 2, -LEN / 2, depth, LEN, 2.5);
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      const p = stage.pointerPos(e);
      let best = -1;
      let bestD = 28;
      for (let i = 0; i < dominoes.length; i++) {
        const d = Math.hypot(dominoes[i].x - p.x, dominoes[i].y - p.y);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best >= 0) topple(best, performance.now());
    }

    ui.addTool('stand them up', reset);
    ui.addTool('new spiral', buildPath);

    stage.onResize = buildPath;
    canvas.addEventListener('pointerdown', onDown);

    buildPath();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};
