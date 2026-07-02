// Loom: a generative weaving machine. Warp threads hang vertically, the
// weft shuttles across row by row, going over and under according to a
// random weave pattern (plain, twill, basket, herringbone). When the cloth
// is full it starts a new bolt.

const PATTERNS = {
  plain: (i, j) => (i + j) % 2 === 0,
  twill: (i, j) => (i + j) % 4 < 2,
  basket: (i, j) => ((i >> 1) + (j >> 1)) % 2 === 0,
  herringbone: (i, j) => {
    const band = (j >> 3) % 2 === 0 ? i + j : i - j;
    return ((band % 4) + 4) % 4 < 2;
  },
};

export default {
  id: 'weave',
  name: 'Loom',
  hint: 'watch the shuttle weave · new pattern below',

  init(stage, ui) {
    const { ctx } = stage;
    const CELL = 18;

    let cols = 0;
    let rows = 0;
    let fabric = null;    // offscreen canvas of completed cells
    let pattern = null;
    let warpColors = [];  // per column
    let weftColors = [];  // per row
    let i = 0;            // weaving head
    let j = 0;
    let done = false;
    let doneAt = 0;
    let raf = 0;

    function palette() {
      const h = Math.random() * 360;
      const mk = (hh, s, l) => `hsl(${(hh + 360) % 360}, ${s}%, ${l}%)`;
      return {
        warp: [mk(h, 40, 62), mk(h + 18, 45, 48), mk(h - 15, 30, 72)],
        weft: [mk(h + 160, 50, 60), mk(h + 190, 45, 50), mk(h + 145, 35, 70)],
      };
    }

    // stripes: random-width bands of the palette colors
    function stripes(count, colors) {
      const out = [];
      let c = 0;
      while (out.length < count) {
        const w = 1 + ((Math.random() * 4) | 0);
        for (let k = 0; k < w && out.length < count; k++) out.push(colors[c % colors.length]);
        c++;
      }
      return out;
    }

    function newCloth() {
      cols = Math.ceil(stage.width / CELL);
      rows = Math.ceil(stage.height / CELL);
      const names = Object.keys(PATTERNS);
      pattern = PATTERNS[names[(Math.random() * names.length) | 0]];
      const pal = palette();
      warpColors = stripes(cols, pal.warp);
      weftColors = stripes(rows, pal.weft);
      fabric = document.createElement('canvas');
      fabric.width = stage.width;
      fabric.height = stage.height;
      i = 0;
      j = 0;
      done = false;
      const fctx = fabric.getContext('2d');
      fctx.fillStyle = '#0d1117';
      fctx.fillRect(0, 0, fabric.width, fabric.height);
      // lay the bare warp first
      for (let c = 0; c < cols; c++) drawThread(fctx, c, -1, true, 0.35);
    }

    // draw one thread segment in a cell; vertical = warp, else weft.
    // j === -1 means the full warp column (pre-weave).
    function drawThread(g, c, r, vertical, dim = 1) {
      const x = c * CELL;
      const y = r * CELL;
      if (vertical) {
        const grad = g.createLinearGradient(x, 0, x + CELL, 0);
        const col = warpColors[c];
        grad.addColorStop(0, shade(col, -25 * dim));
        grad.addColorStop(0.5, shade(col, 10 * dim));
        grad.addColorStop(1, shade(col, -25 * dim));
        g.fillStyle = grad;
        g.globalAlpha = dim;
        if (r === -1) g.fillRect(x + 3, 0, CELL - 6, fabric.height);
        else g.fillRect(x + 3, y - 1, CELL - 6, CELL + 2);
        g.globalAlpha = 1;
      } else {
        const grad = g.createLinearGradient(0, y, 0, y + CELL);
        const col = weftColors[r];
        grad.addColorStop(0, shade(col, -25));
        grad.addColorStop(0.5, shade(col, 10));
        grad.addColorStop(1, shade(col, -25));
        g.fillStyle = grad;
        g.fillRect(x - 1, y + 3, CELL + 2, CELL - 6);
      }
    }

    function shade(hslStr, delta) {
      const m = hslStr.match(/hsl\((.+?), (.+?)%, (.+?)%\)/);
      return `hsl(${m[1]}, ${m[2]}%, ${Math.max(5, Math.min(95, parseFloat(m[3]) + delta))}%)`;
    }

    function weaveCell(c, r) {
      const g = fabric.getContext('2d');
      if (pattern(c, r)) {
        drawThread(g, c, r, false);      // weft under
        drawThread(g, c, r, true);       // warp on top
      } else {
        drawThread(g, c, r, true);       // warp under
        drawThread(g, c, r, false);      // weft on top
      }
    }

    function frame(now) {
      if (!done) {
        for (let k = 0; k < 6 && !done; k++) {
          weaveCell(i, j);
          i++;
          if (i >= cols) {
            i = 0;
            j++;
            stage.audio.plink(700 + (j % 2) * 80, 0.025);
            if (j >= rows) { done = true; doneAt = now; }
          }
        }
      } else if (now - doneAt > 2500) {
        newCloth();
      }

      ctx.drawImage(fabric, 0, 0, stage.width, stage.height);

      // the shuttle
      if (!done) {
        const x = i * CELL;
        const y = j * CELL + CELL / 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 16, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#e6edf3';
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    ui.addTool('new pattern', newCloth);

    stage.onResize = newCloth;
    newCloth();
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  },
};
