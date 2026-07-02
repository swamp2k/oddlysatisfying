// Soap cutting: the ASMR classic. Drag the knife down through the end of
// the bar and a slice breaks into little cubes that tumble off the table.
// When the bar runs out, a fresh one appears.

const SLICE_W = 15;

export default {
  id: 'soap',
  name: 'Soap Cutting',
  hint: 'drag down through the end of the bar',

  init(stage, ui) {
    const { canvas, ctx } = stage;

    let bar = null;   // { x, y, w, h, hue }
    let cubes = [];
    let cutting = false;
    let cutProgress = 0;
    let raf = 0;

    const tableY = () => stage.height * 0.62;

    function newBar() {
      const w = Math.min(stage.width * 0.5, 420);
      bar = {
        w,
        h: 110,
        x: stage.width / 2 - w / 2,
        y: tableY() - 110,
        hue: Math.random() * 360,
      };
    }

    function soapColor(hue, l = 78, a = 1) {
      return `hsla(${hue}, 45%, ${l}%, ${a})`;
    }

    function detachSlice() {
      const cutX = bar.x + bar.w - SLICE_W;
      const n = 5;
      const cs = bar.h / n;
      for (let i = 0; i < n; i++) {
        cubes.push({
          x: cutX + SLICE_W / 2,
          y: bar.y + i * cs + cs / 2,
          vx: 30 + Math.random() * 90,
          vy: -20 + Math.random() * 30,
          rot: 0,
          vr: (Math.random() - 0.5) * 9,
          s: cs - 2,
          hue: bar.hue,
          rest: false,
        });
      }
      bar.w -= SLICE_W;
      stage.audio.pop(0.5);
      stage.audio.plink(520 + Math.random() * 150, 0.06);
      if (bar.w < SLICE_W * 2) newBar();
      if (cubes.length > 260) cubes.splice(0, cubes.length - 260);
    }

    function frame() {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);

      // table
      ctx.fillStyle = '#2a3444';
      ctx.fillRect(0, tableY(), stage.width, 14);
      ctx.fillStyle = '#1d2532';
      ctx.fillRect(0, tableY() + 14, stage.width, stage.height - tableY());

      // bar (the end slice shifts right as the knife descends)
      const cutX = bar.x + bar.w - SLICE_W;
      ctx.fillStyle = soapColor(bar.hue);
      ctx.beginPath();
      ctx.roundRect(bar.x, bar.y, bar.w - SLICE_W, bar.h, [10, 0, 0, 10]);
      ctx.fill();
      ctx.save();
      ctx.translate(cutting ? cutProgress * 5 : 0, 0);
      ctx.fillStyle = soapColor(bar.hue);
      ctx.fillRect(cutX, bar.y, SLICE_W, bar.h);
      ctx.restore();
      // top sheen + stamp
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.roundRect(bar.x + 8, bar.y + 7, Math.max(0, bar.w - SLICE_W - 16), 12, 6);
      ctx.fill();
      ctx.fillStyle = soapColor(bar.hue, 60);
      ctx.font = '700 15px ui-rounded, system-ui, sans-serif';
      ctx.textAlign = 'center';
      if (bar.w > 140) ctx.fillText('· soap ·', bar.x + (bar.w - SLICE_W) / 2, bar.y + bar.h / 2 + 5);

      // knife
      if (cutting) {
        const ky = bar.y + cutProgress * bar.h;
        ctx.fillStyle = '#cfd8dc';
        ctx.fillRect(cutX - 2, ky - 90, 5, 90);
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.roundRect(cutX - 5, ky - 122, 11, 34, 4);
        ctx.fill();
        // score line down the face of the bar
        ctx.strokeStyle = soapColor(bar.hue, 55);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cutX, bar.y);
        ctx.lineTo(cutX, ky);
        ctx.stroke();
      }

      // tumbling cubes
      for (const c of cubes) {
        if (!c.rest) {
          c.vy += 1000 * 0.016;
          c.x += c.vx * 0.016;
          c.y += c.vy * 0.016;
          c.rot += c.vr * 0.016;
          const floor = stage.height - c.s / 2 - 4;
          if (c.y > floor) {
            c.y = floor;
            c.vy *= -0.3;
            c.vx *= 0.7;
            c.vr *= 0.6;
            if (Math.abs(c.vy) < 30) { c.rest = true; c.rot = Math.round(c.rot / (Math.PI / 2)) * (Math.PI / 2); }
          }
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = soapColor(c.hue);
        ctx.beginPath();
        ctx.roundRect(-c.s / 2, -c.s / 2, c.s, c.s, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.roundRect(-c.s / 2 + 3, -c.s / 2 + 3, c.s * 0.45, c.s * 0.3, 3);
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      const p = stage.pointerPos(e);
      cutting = true;
      cutProgress = Math.max(0, Math.min(1, (p.y - bar.y) / bar.h));
    }
    function onMove(e) {
      if (!cutting) return;
      const p = stage.pointerPos(e);
      cutProgress = Math.max(cutProgress, Math.min(1, (p.y - bar.y) / bar.h));
      if (cutProgress >= 1) {
        detachSlice();
        // one slice per stroke — lift the knife to cut again
        cutting = false;
        cutProgress = 0;
      }
    }
    function onUp() { cutting = false; cutProgress = 0; }

    ui.addTool('new bar', () => { newBar(); });
    ui.addTool('tidy up', () => { cubes = []; });

    stage.onResize = () => { newBar(); cubes = []; };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    newBar();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },
};
