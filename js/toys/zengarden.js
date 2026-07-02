// Zen garden: drag to pull a five-tine rake through the sand, leaving
// embossed grooves that curve with your hand. The stones just sit there,
// being stones. Smooth the sand whenever you want to start over.

export default {
  id: 'zengarden',
  name: 'Zen Garden',
  hint: 'drag to rake the sand',

  init(stage, ui) {
    const { canvas, ctx } = stage;
    const TINES = 5;
    const TINE_GAP = 8;

    let sand = null;   // offscreen layer holding the raked grooves
    let stones = [];
    let raking = false;
    let prevP = null;
    let raf = 0;
    let lastScrape = 0;

    function smoothSand() {
      sand = document.createElement('canvas');
      sand.width = stage.width;
      sand.height = stage.height;
      const g = sand.getContext('2d');
      g.fillStyle = '#cbbd9c';
      g.fillRect(0, 0, sand.width, sand.height);
      // fine speckle
      for (let i = 0; i < (sand.width * sand.height) / 300; i++) {
        g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)';
        g.fillRect(Math.random() * sand.width, Math.random() * sand.height, 1.5, 1.5);
      }
    }

    function newStones() {
      stones = [];
      const n = 3 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) {
        stones.push({
          x: stage.width * (0.15 + Math.random() * 0.7),
          y: stage.height * (0.15 + Math.random() * 0.7),
          rx: 22 + Math.random() * 26,
          ry: 16 + Math.random() * 18,
          rot: Math.random() * Math.PI,
          tone: 38 + Math.random() * 14,
        });
      }
    }

    function nearStone(x, y, pad) {
      return stones.some((s) => {
        const dx = x - s.x;
        const dy = y - s.y;
        return (dx * dx) / ((s.rx + pad) ** 2) + (dy * dy) / ((s.ry + pad) ** 2) < 1;
      });
    }

    function rake(a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;
      const px = -dy / len;
      const py = dx / len;
      const g = sand.getContext('2d');
      g.lineCap = 'round';
      for (let k = 0; k < TINES; k++) {
        const off = (k - (TINES - 1) / 2) * TINE_GAP;
        const ax = a.x + px * off;
        const ay = a.y + py * off;
        const bx = b.x + px * off;
        const by = b.y + py * off;
        if (nearStone((ax + bx) / 2, (ay + by) / 2, 10)) continue;
        // groove shadow, then a sunlit edge just above it
        g.strokeStyle = 'rgba(122, 106, 74, 0.55)';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(bx, by);
        g.stroke();
        g.strokeStyle = 'rgba(240, 228, 196, 0.8)';
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(ax - px, ay - py);
        g.lineTo(bx - px, by - py);
        g.stroke();
      }
      const now = performance.now();
      if (now - lastScrape > 130) {
        stage.audio.pop(0.07);
        lastScrape = now;
      }
    }

    function frame() {
      ctx.drawImage(sand, 0, 0, stage.width, stage.height);
      for (const s of stones) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.shadowColor = 'rgba(60, 48, 28, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.beginPath();
        ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(210, 8%, ${s.tone}%)`;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.beginPath();
        ctx.ellipse(-s.rx * 0.25, -s.ry * 0.3, s.rx * 0.45, s.ry * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    }

    function onDown(e) { raking = true; prevP = stage.pointerPos(e); }
    function onMove(e) {
      if (!raking) return;
      const p = stage.pointerPos(e);
      rake(prevP, p);
      prevP = p;
    }
    function onUp() { raking = false; }

    ui.addTool('smooth sand', smoothSand);
    ui.addTool('new stones', () => { newStones(); smoothSand(); });

    stage.onResize = () => { smoothSand(); newStones(); };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    smoothSand();
    newStones();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },
};
