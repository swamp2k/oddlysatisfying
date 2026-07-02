// Power wash: a colorful mural hides under a layer of grime. Hold to spray
// it clean, stripe by stripe, with a proper hiss and water droplets. The
// percentage creeping up is half the satisfaction.

export default {
  id: 'powerwash',
  name: 'Power Wash',
  hint: 'hold to spray the grime away',

  init(stage, ui) {
    const { canvas, ctx } = stage;

    let mural = null;
    let grime = null;
    let spraying = false;
    let pointer = { x: 0, y: 0 };
    let drops = [];
    let hiss = null;
    let raf = 0;
    // coarse grid for the % clean estimate
    let cleanCells = null;
    let cleanCount = 0;
    const CELLW = 26;
    let gcols = 0;
    let grows = 0;

    function paintMural() {
      mural = document.createElement('canvas');
      mural.width = stage.width;
      mural.height = stage.height;
      const g = mural.getContext('2d');
      const h0 = Math.random() * 360;
      const grad = g.createLinearGradient(0, 0, mural.width, mural.height);
      grad.addColorStop(0, `hsl(${h0}, 60%, 55%)`);
      grad.addColorStop(1, `hsl(${h0 + 70}, 60%, 45%)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, mural.width, mural.height);
      // bold shapes
      for (let i = 0; i < 14; i++) {
        g.fillStyle = `hsla(${h0 + Math.random() * 160}, 70%, ${45 + Math.random() * 35}%, 0.85)`;
        const x = Math.random() * mural.width;
        const y = Math.random() * mural.height;
        if (Math.random() < 0.5) {
          g.beginPath();
          g.arc(x, y, 25 + Math.random() * 80, 0, Math.PI * 2);
          g.fill();
        } else {
          g.save();
          g.translate(x, y);
          g.rotate(Math.random() * Math.PI);
          g.fillRect(-100 - Math.random() * 100, -14, 200 + Math.random() * 200, 28);
          g.restore();
        }
      }
    }

    function layGrime() {
      grime = document.createElement('canvas');
      grime.width = stage.width;
      grime.height = stage.height;
      const g = grime.getContext('2d');
      g.fillStyle = '#4a4238';
      g.fillRect(0, 0, grime.width, grime.height);
      for (let i = 0; i < 500; i++) {
        g.fillStyle = `hsla(${25 + Math.random() * 25}, ${10 + Math.random() * 20}%, ${18 + Math.random() * 20}%, 0.5)`;
        g.beginPath();
        g.arc(Math.random() * grime.width, Math.random() * grime.height, 10 + Math.random() * 50, 0, Math.PI * 2);
        g.fill();
      }
      gcols = Math.ceil(stage.width / CELLW);
      grows = Math.ceil(stage.height / CELLW);
      cleanCells = new Uint8Array(gcols * grows);
      cleanCount = 0;
    }

    function spray() {
      const g = grime.getContext('2d');
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 7; i++) {
        const x = pointer.x + (Math.random() - 0.5) * 34;
        const y = pointer.y + (Math.random() - 0.5) * 34;
        const r = 12 + Math.random() * 10;
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(0,0,0,0.9)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();

        const ci = Math.floor(y / CELLW) * gcols + Math.floor(x / CELLW);
        if (ci >= 0 && ci < cleanCells.length && !cleanCells[ci]) {
          cleanCells[ci] = 1;
          cleanCount++;
        }
      }
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        drops.push({
          x: pointer.x, y: pointer.y,
          vx: Math.cos(a) * (60 + Math.random() * 160),
          vy: Math.sin(a) * (60 + Math.random() * 160) - 40,
          life: 0.5,
        });
      }
    }

    function frame() {
      if (spraying) spray();

      ctx.drawImage(mural, 0, 0, stage.width, stage.height);
      ctx.drawImage(grime, 0, 0, stage.width, stage.height);

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.vy += 900 * 0.016;
        d.x += d.vx * 0.016;
        d.y += d.vy * 0.016;
        d.life -= 0.016;
        if (d.life <= 0) { drops.splice(i, 1); continue; }
        ctx.globalAlpha = d.life * 1.6;
        ctx.fillStyle = '#bfe3ff';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // nozzle
      if (spraying) {
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#e6edf3';
        ctx.fill();
      }

      const pct = Math.min(100, Math.round((cleanCount / cleanCells.length) * 100));
      ctx.font = '600 14px ui-rounded, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(230, 237, 243, 0.85)';
      ctx.fillText(pct >= 100 ? 'spotless ✨' : `${pct}% clean`, 16, 26);

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      spraying = true;
      pointer = stage.pointerPos(e);
      hiss = stage.audio.spray();
    }
    function onMove(e) { pointer = stage.pointerPos(e); }
    function onUp() {
      spraying = false;
      if (hiss) { hiss.stop(); hiss = null; }
    }

    ui.addTool('re-grime', layGrime);
    ui.addTool('new mural', () => { paintMural(); layGrime(); });

    stage.onResize = () => { paintMural(); layGrime(); };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    paintMural();
    layGrime();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      if (hiss) hiss.stop();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },
};
