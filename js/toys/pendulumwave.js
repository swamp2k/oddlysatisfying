// Pendulum wave: a row of pendulums whose frequencies differ by a fixed
// step. They drift out of phase into snakes and ribbons, then — every full
// cycle — snap back into a perfect line. Watching them realign is the payoff.

export default {
  id: 'pendulumwave',
  name: 'Pendulum Wave',
  hint: 'wait for it… they all line up again',

  init(stage, ui) {
    const { ctx } = stage;
    const COUNT = 24;
    const CYCLE = 36; // seconds for a full realignment

    let start = performance.now();
    let raf = 0;
    let trails = true;
    let lastAligned = false;

    function draw(now) {
      const t = (now - start) / 1000;

      if (trails) {
        ctx.fillStyle = 'rgba(13, 17, 23, 0.14)';
        ctx.fillRect(0, 0, stage.width, stage.height);
      } else {
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, stage.width, stage.height);
      }

      const cx = stage.width / 2;
      const top = stage.height * 0.12;
      const gap = (stage.height * 0.76) / (COUNT - 1);
      const amp = Math.min(stage.width * 0.38, 420);

      // phase 0..1 through the grand cycle; ding softly on each realignment
      const cyclePhase = (t % CYCLE) / CYCLE;
      const aligned = cyclePhase < 0.004;
      if (aligned && !lastAligned) stage.audio.plink(660, 0.08);
      lastAligned = aligned;

      for (let i = 0; i < COUNT; i++) {
        // pendulum i completes (BASE + i) oscillations per grand cycle
        const oscillations = 20 + i;
        const x = cx + amp * Math.sin(2 * Math.PI * oscillations * cyclePhase);
        const y = top + i * gap;

        const hue = (i / COUNT) * 300 + 160;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hue}, 75%, 65%)`;
        ctx.shadowColor = `hsl(${hue}, 75%, 55%)`;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(draw);
    }

    const trailBtn = ui.addTool('trails: on', () => {
      trails = !trails;
      trailBtn.textContent = trails ? 'trails: on' : 'trails: off';
    });
    ui.addTool('restart', () => { start = performance.now(); });

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, stage.width, stage.height);
    raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  },
};
