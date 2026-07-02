# oddlysatisfying

A tiny gallery of oddly satisfying interactive toys. No goals, no score,
no dependencies — just vibes.

## The toys

| Toy | What it does |
| --- | --- |
| **Bubble Wrap** | An endless sheet of bubbles. Drag across them to pop them (with sound). The sheet quietly regrows when you finish it. |
| **Falling Sand** | Pour rainbow sand from your cursor and watch it heap into dunes. Classic cellular-automaton physics. |
| **Still Pond** | A dark pond you can tap and stir. Real wave-equation ripples, plus optional ambient rain. |
| **Pendulum Wave** | 24 pendulums drift out of phase into snakes and ribbons, then snap back into a perfect line. Wait for it. |
| **Harmonograph** | A pen hung from two decaying pendulums draws endless spirograph figures, each dissolving under the next. |

All sound is synthesized live with the Web Audio API — there are no audio
files. Everything renders to a single `<canvas>` with vanilla JavaScript.

## Run it

It's a static site with ES modules, so it just needs any file server:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Deep-link a toy with its hash, e.g. `#sand`, `#ripples`, `#pendulumwave`.

## Add a toy

Each toy is one module in `js/toys/` exporting `{ id, name, hint, init }`.
`init(stage, ui)` receives a ready-to-draw canvas context (`stage.ctx`,
sized in CSS pixels), pointer helpers, and synthesized sound
(`stage.audio.pop()`, `stage.audio.plink()`), and returns a cleanup
function. Register it in the `toys` array in `js/main.js` and it appears
in the nav.

Ideas that would fit: zen garden raking, kinetic dominoes, magnetic
filings, hydraulic press (of course), power-washing pixels.
