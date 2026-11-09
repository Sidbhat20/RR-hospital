// RR Hospitals — quiet isometric illustrations for empty and completed states.
// Built on the fun-isometric kit, toned down for a finance product:
// thin warm-ink outline, teal + parchment palette, no sparkles or faces,
// small motion amplitudes, played once and then held still.
import { VIEWS, ellipse, line, pill, poly, rect, ring } from './fun'
import { SNAP, jolt, toss, tossLag, tossLag2, sway, bounce } from './motions'
import type { Icon, Shape } from './fun'

const LINE = 3.5
const { tilt: FACE, extrude: EXT } = VIEWS.right
const SOFT_EXT: [number, number] = [EXT[0] * 0.8, EXT[1] * 0.8]

/* Bills ledger: a register page whose lines write themselves in. Empty billing / no bills in period. */
export const ledger: Icon = {
  name: 'ledger',
  frames: 180,
  still: 120,
  line: LINE,
  extrude: SOFT_EXT,
  layers: [
    { a: [0, 130], p: [262, 356], tilt: FACE, shapes: [{ d: rect(-112, -130, 224, 260, 18), fill: 'tint', depth: 1 }] },
    {
      id: 'page',
      a: [0, 130],
      p: [248, 342],
      tilt: FACE,
      m: { ...sway, k: 0.35 },
      shapes: [
        { d: rect(-112, -130, 224, 260, 18), fill: 'white', depth: 0.6 },
        { d: rect(-112, -130, 224, 52, 0), fill: 'main', line: false },
        { d: line([-112, -78], [112, -78]) },
        ...[0, 1, 2, 3].map((i): Shape => ({ d: line([-80, -38 + i * 40], [i === 3 ? 0 : 80, -38 + i * 40]), trim: [[12 + i * 10, 0, SNAP], [42 + i * 10, 1, 0], [150, 1, SNAP], [176, 0]] })),
        { d: line([40, 84], [80, 84]), trim: [[56, 0, SNAP], [80, 1, 0], [150, 1, SNAP], [176, 0]] },
      ],
    },
  ],
}

/* Calendar with a settled check: nothing due in this period. */
const BADGE: [number, number] = [96, 78]
export const calendar: Icon = {
  name: 'calendar',
  frames: 180,
  still: 179,
  line: LINE,
  extrude: SOFT_EXT,
  layers: [
    { id: 'cal', p: [244, 262], m: { ...jolt([-5, 8]), k: 0.6 }, shapes: [] },
    {
      parent: 'cal',
      tilt: FACE,
      shapes: [
        { d: rect(-122, -104, 244, 214, 22), fill: 'white', depth: 1 },
        { d: poly([[-122, -104], [122, -104], [122, -44], [-122, -44]], [22, 22, 0, 0]), fill: 'main' },
        ...[-1, 1].map((s): Shape => ({ d: pill(s * 60 - 11, -126, 22, 46), fill: 'grey', depth: 0.5 })),
        ...[0, 1, 2, 3].flatMap((c) => [0, 1].map((r): Shape => ({ d: rect(-96 + c * 50, -22 + r * 52, 34, 34, 8), ...(c === 1 && r === 1 ? { fill: 'tint' } : {}) }))),
        { d: ellipse(BADGE[0], BADGE[1], 38), fill: 'deep', depth: 0.5 },
        { d: line([BADGE[0] - 17, BADGE[1]], [BADGE[0] - 5, BADGE[1] + 12], [BADGE[0] + 18, BADGE[1] - 13]), line: 5 },
      ],
    },
  ],
}

/* Coin stack: payments received. A single coin settles onto the stack. */
const COIN = (cx: number, cy: number) => ellipse(cx, cy, 108, 74)
export const coins: Icon = {
  name: 'coins',
  frames: 180,
  still: 179,
  line: LINE,
  extrude: [-2, 16],
  layers: [
    { p: [252, 356], r: -8, shapes: [{ d: COIN(0, 0), fill: 'gold', depth: 1 }] },
    { p: [247, 322], r: -8, shapes: [{ d: COIN(0, 0), fill: 'gold', depth: 1 }] },
    {
      p: [242, 284],
      r: -8,
      m: { ...bounce, k: 0.45 },
      shapes: [
        { d: COIN(0, 0), fill: 'gold', depth: 1 },
        { d: ellipse(0, 0, 82, 54) },
        { d: ring(0, 1, 24, 13), fill: 'deep', line: false },
      ],
    },
  ],
}

/* Folder that files paper records away: digitisation done / no paper waiting. */
export const folder: Icon = {
  name: 'folder',
  frames: 180,
  still: 179,
  line: LINE,
  extrude: SOFT_EXT,
  layers: [
    { parent: 'body', shapes: [{ d: poly([[-130, -100], [-56, -100], [-34, -76], [130, -76], [130, 92], [-130, 92]], [16, 8, 8, 16, 16, 16]), fill: 'deep', depth: 1 }] },
    {
      parent: 'body',
      a: [-108, 50],
      p: [-108, 50],
      m: { ...tossLag2, k: 0.4 },
      shapes: [{ d: rect(-104, -136, 206, 192, 10), fill: 'white', depth: 0.3 }, { d: line([-78, -116], [8, -116]) }, { d: line([-78, -96], [40, -96]) }],
    },
    { parent: 'body', a: [-116, 52], p: [-116, 52], m: { ...tossLag, k: 0.4 }, shapes: [{ d: rect(-116, -104, 226, 164, 10), fill: 'tint', depth: 0.3 }] },
    {
      id: 'body',
      a: [-130, 20],
      p: [126, 294],
      tilt: FACE,
      m: { ...toss, k: 0.4 },
      shapes: [{ d: rect(-130, -46, 260, 138, 16), fill: 'main', depth: 1 }, { d: pill(-40, -10, 80, 22), fill: 'white', depth: 0.3 }],
    },
  ],
}

export const ICONS = { ledger, calendar, coins, folder }
