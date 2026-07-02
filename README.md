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
| **Fruit Slicer** | Fruit lobs up in arcs; a fast swipe cuts it into spinning halves with a juice splash. No bombs, no score — you can't lose. |
| **Snow Globe** | A cabin in the woods under glass. Drag inside the globe (or hit shake) to stir the snow, then watch it settle. |
| **Magnet Snap** | Loose shapes on a dot grid that visibly *want* to align — they lean toward the nearest cell, then spring home with a wobble and a click. |
| **Origami** | A sheet of paper folds itself one crease at a time as you drag. After six folds it unfolds in reverse and a fresh sheet appears. |
| **Honey Drizzle** | Hold to pour a glossy amber stream that pools where it lands and slowly slumps sideways, so you can draw with the pile. |
| **Glitter Jar** | Seven hundred flecks of glitter in thick liquid. Swirl them, shake them, watch them sink and twinkle. |
| **Perfect Circle** | Draw a circle freehand and get scored against the true circle fitted to your stroke. Best score sticks around. |
| **Loom** | A generative weaving machine: the shuttle runs over and under the warp in plain, twill, basket, or herringbone patterns. |
| **Zen Garden** | Pull a five-tine rake through the sand, leaving embossed grooves that curve with your hand. The stones just sit there. |
| **Power Wash** | A colorful mural hides under grime. Hold to spray it clean, stripe by stripe, hiss included. |
| **Dominoes** | A spiral of dominoes seen from above. Tap one and the wave clacks all the way to the center. |

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

Ideas that would fit: hydraulic press (of course), magnetic filings,
soap cutting, kinetic marble runs, wood planing curls, paint mixing.
