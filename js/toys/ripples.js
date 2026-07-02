// Still pond: the classic two-buffer water ripple algorithm. Click to drop a
// pebble, drag to trail your finger through the surface. Occasionally it
// rains on its own so the pond never goes fully still.

export default {
  id: 'ripples',
  name: 'Still Pond',
  hint: 'tap the water · drag to stir it',

  init(stage, ui) {
    const { canvas, ctx } = stage;
    const SCALE = 3; // simulation runs at 1/3 resolution

    let w = 0;
    let h = 0;
    let curr = null;
    let prev = null;
    let raf = 0;
    let dragging = false;
    let rain = true;
    let offscreen = null;

    function rebuild() {
      w = Math.max(4, Math.floor(stage.width / SCALE));
      h = Math.max(4, Math.floor(stage.height / SCALE));
      curr = new Float32Array(w * h);
      prev = new Float32Array(w * h);
      offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
    }

    function disturb(px, py, strength = 220, radius = 2) {
      const cx = Math.floor(px / SCALE);
      const cy = Math.floor(py / SCALE);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x > 0 && x < w - 1 && y > 0 && y < h - 1) {
            const fall = 1 - Math.hypot(dx, dy) / (radius + 1);
            if (fall > 0) prev[y * w + x] -= strength * fall;
          }
        }
      }
    }

    function stepAndRender() {
      // wave equation: new height from neighbor average minus previous height
      for (let y = 1; y < h - 1; y++) {
        const row = y * w;
        for (let x = 1; x < w - 1; x++) {
          const i = row + x;
          const v =
            (prev[i - 1] + prev[i + 1] + prev[i - w] + prev[i + w]) / 2 - curr[i];
          curr[i] = v * 0.985; // damping
        }
      }
      [curr, prev] = [prev, curr];

      const octx = offscreen.getContext('2d');
      const img = octx.createImageData(w, h);
      const px = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          // shade by the horizontal slope so ripples catch the light
          const slope = prev[i] - (x < w - 1 ? prev[i + 1] : prev[i]);
          const light = Math.max(-60, Math.min(90, slope * 0.9));
          const depth = y / h; // deeper water is darker
          const o = i * 4;
          px[o] = 16 + light * 0.35 + (1 - depth) * 8;
          px[o + 1] = 52 + light * 0.8 + (1 - depth) * 18;
          px[o + 2] = 76 + light + (1 - depth) * 26;
          px[o + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(offscreen, 0, 0, stage.width, stage.height);
    }

    function frame() {
      if (rain && Math.random() < 0.02) {
        disturb(Math.random() * stage.width, Math.random() * stage.height, 140, 1);
        stage.audio.plink(300 + Math.random() * 500, 0.05);
      }
      stepAndRender();
      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      dragging = true;
      const p = stage.pointerPos(e);
      disturb(p.x, p.y, 320, 3);
      stage.audio.plink(200 + Math.random() * 250, 0.12);
    }
    function onMove(e) {
      if (!dragging) return;
      const p = stage.pointerPos(e);
      disturb(p.x, p.y, 90, 1);
    }
    function onUp() { dragging = false; }

    const rainBtn = ui.addTool('rain: on', () => {
      rain = !rain;
      rainBtn.textContent = rain ? 'rain: on' : 'rain: off';
    });

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
