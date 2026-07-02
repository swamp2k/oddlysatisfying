// Marble run: marbles rain onto a staircase of wooden ramps, rolling and
// plinking their way down forever — anything that falls off the bottom
// reappears at the top. Click to drop more where you point.

export default {
  id: 'marbles',
  name: 'Marble Run',
  hint: 'tap to drop a marble',

  init(stage, ui) {
    const { canvas, ctx } = stage;
    const R = 8;

    let ramps = [];
    let marbles = [];
    let raf = 0;
    let lastPlink = 0;
    let stream = true;
    let streamTimer = 0;

    function buildRamps() {
      ramps = [];
      const n = 5;
      const top = stage.height * 0.16;
      const bottom = stage.height * 0.9;
      for (let i = 0; i < n; i++) {
        const y1 = top + ((bottom - top) * i) / n;
        const y2 = y1 + (bottom - top) / n - 26;
        if (i % 2 === 0) {
          ramps.push({ x1: stage.width * 0.02, y1, x2: stage.width * 0.72, y2: y2 + 12 });
        } else {
          ramps.push({ x1: stage.width * 0.98, y1, x2: stage.width * 0.28, y2: y2 + 12 });
        }
      }
    }

    function addMarble(x, y) {
      marbles.push({
        x, y,
        vx: 0, vy: 0,
        hue: Math.random() * 360,
      });
      if (marbles.length > 60) marbles.shift();
    }

    function respawn(m) {
      m.x = stage.width * (0.1 + Math.random() * 0.5);
      m.y = -R * 2;
      m.vx = 0;
      m.vy = 0;
    }

    function collide(m, seg, now) {
      const dx = seg.x2 - seg.x1;
      const dy = seg.y2 - seg.y1;
      const len2 = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((m.x - seg.x1) * dx + (m.y - seg.y1) * dy) / len2));
      const px = seg.x1 + dx * t;
      const py = seg.y1 + dy * t;
      let nx = m.x - px;
      let ny = m.y - py;
      const d = Math.hypot(nx, ny);
      if (d >= R + 4 || d === 0) return;
      nx /= d;
      ny /= d;
      m.x = px + nx * (R + 4);
      m.y = py + ny * (R + 4);
      const vn = m.vx * nx + m.vy * ny;
      if (vn < 0) {
        m.vx -= (1 + 0.35) * vn * nx;
        m.vy -= (1 + 0.35) * vn * ny;
        // rolling friction on the tangential part
        m.vx *= 0.995;
        m.vy *= 0.995;
        if (vn < -110 && now - lastPlink > 70) {
          stage.audio.plink(320 + (m.x / stage.width) * 480, Math.min(0.12, -vn / 3000));
          lastPlink = now;
        }
      }
    }

    function frame(now) {
      streamTimer -= 16;
      if (stream && streamTimer <= 0) {
        addMarble(stage.width * (0.1 + Math.random() * 0.5), -R);
        streamTimer = 700;
      }

      const dt = 1 / 60;
      for (const m of marbles) {
        // substeps keep fast marbles from tunnelling through ramps
        for (let s = 0; s < 2; s++) {
          m.vy += 1300 * dt / 2;
          m.x += m.vx * dt / 2;
          m.y += m.vy * dt / 2;
          for (const seg of ramps) collide(m, seg, now);
        }
        if (m.y > stage.height + R * 3 || m.x < -30 || m.x > stage.width + 30) respawn(m);
      }

      // marbles nudge each other apart so trains queue instead of overlap
      for (let i = 0; i < marbles.length; i++) {
        for (let j = i + 1; j < marbles.length; j++) {
          const a = marbles[i];
          const b = marbles[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d === 0 || d >= R * 2) continue;
          dx /= d;
          dy /= d;
          const push = (R * 2 - d) / 2;
          a.x -= dx * push; a.y -= dy * push;
          b.x += dx * push; b.y += dy * push;
          // exchange the closing component of their velocities
          const rel = (b.vx - a.vx) * dx + (b.vy - a.vy) * dy;
          if (rel < 0) {
            const imp = rel * 0.6;
            a.vx += dx * imp; a.vy += dy * imp;
            b.vx -= dx * imp; b.vy -= dy * imp;
          }
        }
      }

      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);

      // ramps
      for (const seg of ramps) {
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 235, 210, 0.25)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1 - 3);
        ctx.lineTo(seg.x2, seg.y2 - 3);
        ctx.stroke();
      }

      // marbles
      for (const m of marbles) {
        const g = ctx.createRadialGradient(m.x - R * 0.35, m.y - R * 0.35, R * 0.15, m.x, m.y, R);
        g.addColorStop(0, `hsl(${m.hue}, 70%, 78%)`);
        g.addColorStop(1, `hsl(${m.hue}, 65%, 48%)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, R, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(m.x - R * 0.35, m.y - R * 0.4, R * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      const p = stage.pointerPos(e);
      addMarble(p.x, p.y);
    }

    const streamBtn = ui.addTool('stream: on', () => {
      stream = !stream;
      streamBtn.textContent = stream ? 'stream: on' : 'stream: off';
    });
    ui.addTool('new ramps', buildRamps);

    stage.onResize = buildRamps;
    canvas.addEventListener('pointerdown', onDown);

    buildRamps();
    for (let i = 0; i < 8; i++) addMarble(stage.width * (0.1 + Math.random() * 0.5), Math.random() * -300);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};
