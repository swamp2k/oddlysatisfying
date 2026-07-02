// Harmonograph: a virtual pen suspended from two decaying pendulums draws
// endless spirograph-like figures. Each drawing slowly fades as the next
// begins. Click anywhere to start a fresh figure.

export default {
  id: 'harmonograph',
  name: 'Harmonograph',
  hint: 'sit back and watch it draw · click for a new figure',

  init(stage, ui) {
    const { canvas, ctx } = stage;

    let raf = 0;
    let params = null;
    let t = 0;
    let hueBase = 0;
    let prevPoint = null;

    function randomFigure() {
      // near-integer frequency ratios give the prettiest closed-ish curves
      const detune = () => (Math.random() - 0.5) * 0.02;
      params = {
        fx1: 2 + Math.floor(Math.random() * 4) + detune(),
        fy1: 2 + Math.floor(Math.random() * 4) + detune(),
        fx2: 1 + Math.floor(Math.random() * 3) + detune(),
        fy2: 1 + Math.floor(Math.random() * 3) + detune(),
        px1: Math.random() * Math.PI * 2,
        py1: Math.random() * Math.PI * 2,
        px2: Math.random() * Math.PI * 2,
        py2: Math.random() * Math.PI * 2,
        decay: 0.00012 + Math.random() * 0.0001,
      };
      t = 0;
      hueBase = Math.random() * 360;
      prevPoint = null;
    }

    function pen(time) {
      const p = params;
      const damp = Math.exp(-p.decay * time);
      const ax = Math.min(stage.width, stage.height) * 0.32;
      const ay = ax;
      const x =
        stage.width / 2 +
        damp * (ax * Math.sin(p.fx1 * time * 0.002 + p.px1) +
                ax * 0.5 * Math.sin(p.fx2 * time * 0.002 + p.px2));
      const y =
        stage.height / 2 +
        damp * (ay * Math.sin(p.fy1 * time * 0.002 + p.py1) +
                ay * 0.5 * Math.sin(p.fy2 * time * 0.002 + p.py2));
      return { x, y, damp };
    }

    function frame() {
      // gentle fade so old figures dissolve underneath the new one
      ctx.fillStyle = 'rgba(13, 17, 23, 0.008)';
      ctx.fillRect(0, 0, stage.width, stage.height);

      // draw several pen steps per frame for a smooth, fast line
      for (let i = 0; i < 24; i++) {
        const pt = pen(t);
        if (prevPoint) {
          const hue = (hueBase + t * 0.004) % 360;
          ctx.strokeStyle = `hsla(${hue}, 75%, 66%, ${0.55 + pt.damp * 0.4})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        }
        prevPoint = pt;
        t += 4;
      }

      // when the pendulums have nearly died out, begin a new figure
      if (Math.exp(-params.decay * t) < 0.12) randomFigure();

      raf = requestAnimationFrame(frame);
    }

    function onDown() { randomFigure(); }

    ui.addTool('new figure', randomFigure);

    stage.onResize = () => {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, stage.width, stage.height);
      prevPoint = null;
    };
    canvas.addEventListener('pointerdown', onDown);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, stage.width, stage.height);
    randomFigure();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};
