// Falling sand: the classic cellular automaton. Pour rainbow sand from the
// cursor and watch it heap into dunes. Hold to pour, hue drifts over time.

export default {
  id: 'sand',
  name: 'Falling Sand',
  hint: 'hold and drag to pour sand',

  init(stage, ui) {
    const { canvas, ctx } = stage;
    const CELL = 4; // CSS pixels per grain

    let cols = 0;
    let rows = 0;
    let grid = null;      // Int16Array of hue+1 (0 = empty)
    let raf = 0;
    let pouring = false;
    let pointer = { x: 0, y: 0 };
    let hue = 30;
    let offscreen = null; // grain-resolution canvas, scaled up when blitting

    function rebuild() {
      cols = Math.max(1, Math.floor(stage.width / CELL));
      rows = Math.max(1, Math.floor(stage.height / CELL));
      grid = new Int16Array(cols * rows);
      offscreen = document.createElement('canvas');
      offscreen.width = cols;
      offscreen.height = rows;
    }

    function pour() {
      const cx = Math.floor(pointer.x / CELL);
      const cy = Math.floor(pointer.y / CELL);
      const R = 3;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          if (dx * dx + dy * dy > R * R || Math.random() < 0.5) continue;
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < cols && y >= 0 && y < rows && !grid[y * cols + x]) {
            grid[y * cols + x] = 1 + ((hue + Math.random() * 18) | 0) % 360;
          }
        }
      }
      hue = (hue + 0.6) % 360;
    }

    function step() {
      // Bottom-up scan; alternate the horizontal sweep each row to avoid bias.
      for (let y = rows - 2; y >= 0; y--) {
        const leftToRight = (y & 1) === 0;
        for (let i = 0; i < cols; i++) {
          const x = leftToRight ? i : cols - 1 - i;
          const idx = y * cols + x;
          const grain = grid[idx];
          if (!grain) continue;

          const below = idx + cols;
          if (!grid[below]) {
            grid[below] = grain;
            grid[idx] = 0;
            continue;
          }
          const dir = Math.random() < 0.5 ? -1 : 1;
          if (x + dir >= 0 && x + dir < cols && !grid[below + dir]) {
            grid[below + dir] = grain;
            grid[idx] = 0;
          } else if (x - dir >= 0 && x - dir < cols && !grid[below - dir]) {
            grid[below - dir] = grain;
            grid[idx] = 0;
          }
        }
      }
    }

    function render() {
      const octx = offscreen.getContext('2d');
      const img = octx.createImageData(cols, rows);
      const px = img.data;
      for (let i = 0; i < grid.length; i++) {
        const grain = grid[i];
        const o = i * 4;
        if (grain) {
          const [r, g, b] = hsl(grain - 1, 70, 60);
          px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
        } else {
          px[o] = 13; px[o + 1] = 17; px[o + 2] = 23; px[o + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, stage.width, stage.height);
    }

    function hsl(h, s, l) {
      s /= 100; l /= 100;
      const k = (n) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return [f(0) * 255, f(8) * 255, f(4) * 255];
    }

    function frame() {
      if (pouring) pour();
      step();
      step(); // two physics steps per frame keeps the flow lively
      render();
      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      pouring = true;
      pointer = stage.pointerPos(e);
    }
    function onMove(e) { pointer = stage.pointerPos(e); }
    function onUp() { pouring = false; }

    ui.addTool('clear', () => grid.fill(0));

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
