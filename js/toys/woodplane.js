// Wood planing: drag the hand plane along the rough board and a shaving
// curls up off the blade, stripe by stripe, until the whole face is smooth.
// The curls drop and pile up below the bench.

export default {
  id: 'woodplane',
  name: 'Wood Planing',
  hint: 'drag along the board to plane it smooth',

  init(stage, ui) {
    const { canvas, ctx } = stage;
    const LANES = 6;

    let board = null;   // { x, y, w, h }
    let rough = null;   // overlay canvas, erased as you plane
    let planing = false;
    let plane = { x: 0, lane: 0 };
    let curl = 0;       // length of the shaving currently on the blade
    let shavings = [];  // fallen curls
    let hiss = null;
    let raf = 0;

    function rebuild() {
      const w = stage.width * 0.72;
      const h = Math.min(stage.height * 0.44, 270);
      board = {
        x: (stage.width - w) / 2,
        y: (stage.height - h) / 2 - 20,
        w, h,
      };
      shavings = [];
      layRough();
    }

    function layRough() {
      rough = document.createElement('canvas');
      rough.width = stage.width;
      rough.height = stage.height;
      const g = rough.getContext('2d');
      g.fillStyle = '#7a5230';
      g.fillRect(board.x, board.y, board.w, board.h);
      // mottled weathering
      for (let i = 0; i < 900; i++) {
        g.fillStyle = `hsla(${20 + Math.random() * 18}, ${30 + Math.random() * 25}%, ${18 + Math.random() * 22}%, 0.4)`;
        g.beginPath();
        g.ellipse(
          board.x + Math.random() * board.w,
          board.y + Math.random() * board.h,
          3 + Math.random() * 22, 1 + Math.random() * 3,
          0, 0, Math.PI * 2,
        );
        g.fill();
      }
    }

    function laneY(lane) {
      return board.y + (lane + 0.5) * (board.h / LANES);
    }

    function erase(x0, x1, lane) {
      const g = rough.getContext('2d');
      g.globalCompositeOperation = 'destination-out';
      const lh = board.h / LANES;
      g.fillRect(Math.min(x0, x1), laneY(lane) - lh / 2, Math.abs(x1 - x0) + 1, lh);
      g.globalCompositeOperation = 'source-over';
    }

    function dropCurl() {
      if (curl < 12) { curl = 0; return; }
      shavings.push({
        x: plane.x - 20,
        y: laneY(plane.lane) - 26,
        vy: 0,
        vx: (Math.random() - 0.5) * 40,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 4,
        turns: Math.min(4.5, 1 + curl / 60),
        rest: false,
      });
      if (shavings.length > 36) shavings.shift();
      curl = 0;
    }

    function drawCurl(x, y, turns, scale = 1) {
      ctx.strokeStyle = '#e8c99a';
      ctx.lineWidth = 3.2 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let t = 0; t <= turns * Math.PI * 2; t += 0.25) {
        const r = (2.5 + t * 1.35) * scale;
        const px = x + Math.cos(t - Math.PI / 2) * r;
        const py = y - Math.sin(t - Math.PI / 2) * r;
        if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    function frame() {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);

      // bench
      ctx.fillStyle = '#232c3a';
      ctx.fillRect(0, board.y + board.h, stage.width, 12);

      // smooth wood underneath
      const g2 = ctx.createLinearGradient(0, board.y, 0, board.y + board.h);
      g2.addColorStop(0, '#c99e63');
      g2.addColorStop(1, '#b3874e');
      ctx.fillStyle = g2;
      ctx.fillRect(board.x, board.y, board.w, board.h);
      // grain
      ctx.strokeStyle = 'rgba(122, 82, 48, 0.35)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 9; i++) {
        const gy = board.y + ((i + 0.5) / 9) * board.h;
        ctx.beginPath();
        for (let x = 0; x <= board.w; x += 14) {
          const y = gy + Math.sin(x * 0.03 + i * 7) * 3;
          if (x === 0) ctx.moveTo(board.x + x, y); else ctx.lineTo(board.x + x, y);
        }
        ctx.stroke();
      }

      // rough layer on top
      ctx.drawImage(rough, 0, 0, stage.width, stage.height);

      // the plane and its growing shaving
      if (planing) {
        const y = laneY(plane.lane);
        if (curl > 0) drawCurl(plane.x - 16, y - 22, Math.min(4.5, 1 + curl / 60));
        ctx.save();
        ctx.translate(plane.x, y);
        ctx.fillStyle = '#455a75';
        ctx.beginPath();
        ctx.roundRect(-34, -14, 68, 18, 4);
        ctx.fill();
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.roundRect(8, -32, 12, 20, 5);   // rear handle
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-22, -20, 7, 0, Math.PI * 2); // front knob
        ctx.fill();
        ctx.restore();
      }

      // fallen shavings
      for (const s of shavings) {
        if (!s.rest) {
          s.vy += 500 * 0.016;
          s.x += s.vx * 0.016;
          s.y += s.vy * 0.016;
          s.rot += s.vr * 0.016;
          const floor = stage.height - 18 - s.turns * 4;
          if (s.y > floor) { s.y = floor; s.rest = true; }
        }
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        drawCurl(0, 0, s.turns, 0.9);
        ctx.restore();
      }

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      const p = stage.pointerPos(e);
      if (p.y < board.y - 30 || p.y > board.y + board.h + 30) return;
      planing = true;
      curl = 0;
      plane.lane = Math.max(0, Math.min(LANES - 1, Math.floor((p.y - board.y) / (board.h / LANES))));
      plane.x = Math.max(board.x, Math.min(board.x + board.w, p.x));
      hiss = stage.audio.spray();
    }
    function onMove(e) {
      if (!planing) return;
      const p = stage.pointerPos(e);
      const nx = Math.max(board.x, Math.min(board.x + board.w, p.x));
      erase(plane.x, nx, plane.lane);
      curl += Math.abs(nx - plane.x);
      plane.x = nx;
    }
    function onUp() {
      if (!planing) return;
      planing = false;
      dropCurl();
      if (hiss) { hiss.stop(); hiss = null; }
    }

    ui.addTool('new board', rebuild);

    stage.onResize = rebuild;
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    rebuild();
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
