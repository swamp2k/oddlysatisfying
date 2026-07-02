// Magnetic filings: a table of iron filings and one bar magnet. Drag the
// magnet around and thousands of filings swing into the field lines,
// glowing brighter where the field is strong.

export default {
  id: 'filings',
  name: 'Magnetic Filings',
  hint: 'drag the magnet around',

  init(stage) {
    const { canvas, ctx } = stage;
    const SPACING = 15;
    const HALF_LEN = 62; // pole distance from magnet center

    let filings = [];
    let magnet = { x: 0, y: 0, angle: -0.5 };
    let dragging = false;
    let grabOff = { x: 0, y: 0 };
    let raf = 0;

    function rebuild() {
      filings = [];
      for (let y = SPACING / 2; y < stage.height; y += SPACING) {
        for (let x = SPACING / 2; x < stage.width; x += SPACING) {
          filings.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            a: Math.random() * Math.PI,
          });
        }
      }
      magnet.x = stage.width / 2;
      magnet.y = stage.height / 2;
    }

    function poles() {
      const dx = Math.cos(magnet.angle) * HALF_LEN;
      const dy = Math.sin(magnet.angle) * HALF_LEN;
      return {
        n: { x: magnet.x + dx, y: magnet.y + dy },
        s: { x: magnet.x - dx, y: magnet.y - dy },
      };
    }

    function frame() {
      const { n, s } = poles();

      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);

      for (const f of filings) {
        // dipole field: source at N, sink at S
        let dnx = f.x - n.x, dny = f.y - n.y;
        let dsx = f.x - s.x, dsy = f.y - s.y;
        const rn3 = Math.pow(dnx * dnx + dny * dny, 1.5) + 1;
        const rs3 = Math.pow(dsx * dsx + dsy * dsy, 1.5) + 1;
        const bx = dnx / rn3 - dsx / rs3;
        const by = dny / rn3 - dsy / rs3;
        const target = Math.atan2(by, bx);

        // filings have no head or tail — work modulo pi
        let diff = target - f.a;
        while (diff > Math.PI / 2) diff -= Math.PI;
        while (diff < -Math.PI / 2) diff += Math.PI;
        f.a += diff * 0.25;

        const strength = Math.hypot(bx, by) * 1e5;
        const lit = Math.min(1, strength * 0.55);
        const len = 4.5 + lit * 3;
        ctx.strokeStyle = `rgba(${140 + lit * 100}, ${160 + lit * 80}, ${185 + lit * 60}, ${0.22 + lit * 0.7})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(f.x - Math.cos(f.a) * len, f.y - Math.sin(f.a) * len);
        ctx.lineTo(f.x + Math.cos(f.a) * len, f.y + Math.sin(f.a) * len);
        ctx.stroke();
      }

      // the magnet
      ctx.save();
      ctx.translate(magnet.x, magnet.y);
      ctx.rotate(magnet.angle);
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#ef5350';
      ctx.beginPath();
      ctx.roundRect(0, -17, HALF_LEN + 12, 34, [0, 8, 8, 0]);
      ctx.fill();
      ctx.fillStyle = '#5c8bef';
      ctx.beginPath();
      ctx.roundRect(-HALF_LEN - 12, -17, HALF_LEN + 12, 34, [8, 0, 0, 8]);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '700 18px ui-rounded, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', HALF_LEN / 2 + 6, 1);
      ctx.fillText('S', -HALF_LEN / 2 - 6, 1);
      ctx.restore();

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      const p = stage.pointerPos(e);
      if (Math.hypot(p.x - magnet.x, p.y - magnet.y) < HALF_LEN + 30) {
        dragging = true;
        grabOff = { x: magnet.x - p.x, y: magnet.y - p.y };
      }
    }
    function onMove(e) {
      if (!dragging) return;
      const p = stage.pointerPos(e);
      const nx = p.x + grabOff.x;
      const ny = p.y + grabOff.y;
      // the magnet turns to follow the direction it's being led
      const mx = nx - magnet.x;
      const my = ny - magnet.y;
      if (Math.hypot(mx, my) > 2) {
        let diff = Math.atan2(my, mx) - magnet.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        magnet.angle += diff * 0.12;
      }
      magnet.x = nx;
      magnet.y = ny;
    }
    function onUp() { dragging = false; }

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
