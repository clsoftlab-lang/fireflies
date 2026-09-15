// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CLSOFTLAB (씨엘소프트랩), Dr. Lee Il-guk (이일국)
//
// main.js — the Fireflies browser simulator (spec §8).
//
// Ties the pure modules together: a wind field drifts hundreds of sky-jellyfish;
// each runs a pulse-coupled oscillator (coupled to the neighbours it can see via
// a spatial grid) so blinking falls into slow waves of unison; tendrils sway and
// trail on the wind with light flowing down them; bells carry an amber glow and a
// sharp capacitor spark-flash. Fixed-timestep sim, requestAnimationFrame render,
// additive glow via pre-rendered sprites, and an FPS-driven auto-degrade.

import { mulberry32, randRange, randInt } from './rng.js';
import { createWindField, windAt } from './wind.js';
import { ramp, couple, orderParameter } from './sync.js';
import {
  createJelly,
  updateBell,
  updateTendril,
  flowWave,
  jellyFlash,
} from './jelly.js';

// ---------------------------------------------------------------------------
// Canvas / DPR
// ---------------------------------------------------------------------------
const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d', { alpha: false });
let W = 0, H = 0, DPR = 1;
let bgGrad = null;

function resize() {
  DPR = Math.min(1.5, window.devicePixelRatio || 1);
  // Derive the WORLD size from the canvas's own laid-out box (CSS pixels), not
  // window.innerWidth — the two can disagree (scrollbars, zoom, an emulated or
  // embedded viewport), which would pin the simulation to the wrong width and
  // leave part of the sky empty. The canvas is fixed inset:0 / 100%, so its
  // client box is the true drawn area; CSS governs layout, DPR only the backing
  // store. Recomputed on load and on every canvas resize (ResizeObserver below).
  const rect = canvas.getBoundingClientRect();
  W = Math.max(1, Math.round(rect.width || window.innerWidth));
  H = Math.max(1, Math.round(rect.height || window.innerHeight));
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0.0, '#05070f');
  bgGrad.addColorStop(0.45, '#080c1c');
  bgGrad.addColorStop(0.8, '#0a1024');
  bgGrad.addColorStop(1.0, '#0c1330');
}
window.addEventListener('resize', resize);
// Track the live canvas box directly — more robust than window 'resize' alone,
// and catches embedded/emulated layout changes. Setting canvas.width does not
// alter the CSS-governed box, so this does not loop.
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => resize()).observe(canvas);
}

// ---------------------------------------------------------------------------
// Pre-rendered glow sprites (cheap additive bloom — no per-frame gradients)
// ---------------------------------------------------------------------------
function makeGlowSprite(r, g, b) {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g2 = c.getContext('2d');
  const grad = g2.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.25, `rgba(${r},${g},${b},0.55)`);
  grad.addColorStop(0.55, `rgba(${r},${g},${b},0.16)`);
  grad.addColorStop(1.0, `rgba(${r},${g},${b},0)`);
  g2.fillStyle = grad;
  g2.fillRect(0, 0, size, size);
  return c;
}
const spriteAmber = makeGlowSprite(255, 176, 74);
const spriteWarm = makeGlowSprite(255, 226, 170);
const spriteCool = makeGlowSprite(176, 214, 255);
const spriteWhite = makeGlowSprite(240, 246, 255);

function drawSprite(sprite, x, y, r, alpha) {
  if (alpha <= 0.003 || r <= 0.2) return;
  ctx.globalAlpha = alpha > 1 ? 1 : alpha;
  ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
}

// ---------------------------------------------------------------------------
// Simulation state
// ---------------------------------------------------------------------------
const SIM_DT = 1 / 60;         // fixed timestep
const params = {
  count: 300,
  wind: 55,
  T: 1.6,
  epsilon: 0.09,
  tendrilCount: 5,
  tendrilLen: 72,
  spark: 0.3,                  // 0 amber → 1 cool/blue in the flash
  glow: 1.0,
  motion: 'full',             // full | reduced | still
  releasing: true,            // dispenser active
  frozen: false,              // freeze the whole scene
};

let seed = (Math.random() * 1e9) >>> 0;
let rng = mulberry32(seed);
let wind = createWindField(seed);
let jellies = [];
let simTime = 0;
let idCounter = 0;
let autoMax = 3000;           // FPS-driven soft cap on active jellies
let qualityTendril = 1;       // 1 = full tendril detail, <1 = degrade

// Dispenser: a strip along the bottom-centre.
function dispenserX() { return W * (0.5 + randRange(rng, -0.3, 0.3)); }
function dispenserY() { return H + 8; }

// Seed a handful spread across the whole sky so it is alive immediately (used on
// first load and on "New sky"), with random phases so synchrony visibly emerges.
function seedSpread(nCount) {
  for (let i = 0; i < nCount; i++) {
    const j = makeOne();
    j.x = randRange(rng, W * 0.04, W * 0.96);
    j.y = randRange(rng, H * 0.08, H * 0.94);
    j.vx = randRange(rng, -14, 14);
    j.vy = randRange(rng, -12, 8);
    j.phase = rng();
    j.birth = 2;
    for (let k = 0; k < j.tendrils.length; k++) {
      const t = j.tendrils[k];
      for (let s = 0; s <= t.nSeg; s++) {
        t.pts[s].x = j.x; t.pts[s].y = j.y + s * t.segLen;
        t.pts[s].px = t.pts[s].x; t.pts[s].py = t.pts[s].y;
      }
    }
    jellies.push(j);
  }
}

function makeOne() {
  const x = dispenserX();
  const y = dispenserY();
  const j = createJelly({
    x, y,
    id: idCounter++,
    rng,
    T: params.T,
    phase: rng(),
    tendrilCount: params.tendrilCount,
    tendrilSegs: 8,
    tendrilLen: params.tendrilLen,
    size: randRange(rng, 4.5, 9),
  });
  // released with a gentle upward puff so it rises off the dispenser
  j.vy = -randRange(rng, 24, 46);
  j.vx = randRange(rng, -10, 10);
  return j;
}

function rebuildTendrils(j) {
  // Re-create tendrils when count/length controls change (keeps bell + phase).
  const segs = 8;
  const segLen = params.tendrilLen / segs;
  const arr = [];
  for (let k = 0; k < params.tendrilCount; k++) {
    const pts = new Array(segs + 1);
    for (let i = 0; i <= segs; i++) {
      pts[i] = { x: j.x, y: j.y + i * segLen, px: j.x, py: j.y + i * segLen };
    }
    arr.push({ pts, nSeg: segs, segLen });
  }
  j.tendrils = arr;
  j.tendrilLen = params.tendrilLen;
  j.segLen = segLen;
}

function resetSky() {
  seed = (Math.random() * 1e9) >>> 0;
  rng = mulberry32(seed);
  wind = createWindField(seed);
  jellies = [];
  idCounter = 0;
  simTime = 0;
  seedSpread(Math.min(70, Math.min(params.count, autoMax)));
}

// ---------------------------------------------------------------------------
// Spatial grid for pulse-coupled synchrony (each bell sees nearby flashes).
// ---------------------------------------------------------------------------
const COUPLE_RADIUS = 110;
let gridCols = 0, gridRows = 0, gridCell = COUPLE_RADIUS;
let flashGrid = new Int16Array(0);

function ensureGrid() {
  const cols = Math.max(1, Math.ceil(W / gridCell));
  const rows = Math.max(1, Math.ceil(H / gridCell));
  if (cols !== gridCols || rows !== gridRows) {
    gridCols = cols;
    gridRows = rows;
    flashGrid = new Int16Array(cols * rows);
  }
}

// ---------------------------------------------------------------------------
// One fixed-timestep simulation step
// ---------------------------------------------------------------------------
function motionScale() {
  if (params.motion === 'still') return 0.06;
  if (params.motion === 'reduced') return 0.4;
  return 1;
}

function step(dt) {
  simTime += dt;
  const ms = motionScale();
  const windScale = params.wind * ms;
  ensureGrid();
  flashGrid.fill(0);

  // Base prevailing drift so the field always has a gentle lane of travel.
  const baseDrift = 0.18 * windScale;

  const margin = 140;

  // Pass 1: ramp phases, advect bells, deposit flashes onto the grid.
  for (let n = 0; n < jellies.length; n++) {
    const j = jellies[n];

    // --- blink oscillator ---
    const r = ramp(j.phase, dt, params.T);
    j.phase = r.phase;
    if (r.fired) {
      j.lastFlash = 0;
    } else {
      j.lastFlash += dt;
    }

    // --- wind advection with soft inertia + an independent slow wander ---
    const wv = windAt(wind, j.x, j.y, simTime);
    const wx = wv.x * windScale * j.windResp + baseDrift;
    const wy = wv.y * windScale * 0.7 * j.windResp - 0.02 * windScale; // faint upward bias
    updateBell(j, wx, wy, dt, { drag: 1.7, lift: 1.1 * ms });
    // per-jelly meander so clumps disperse and never quite repeat (spec F1/§8)
    const wander = (12 + 0.18 * windScale) * ms;
    j.vx += Math.sin(simTime * j.wf1 + j.wa) * wander * dt;
    j.vy += (Math.cos(simTime * j.wf2 + j.wb) * 0.7 + j.buoy * 0.5) * wander * dt;

    // --- tendrils sway/trail behind the bell ---
    if (!params.frozen) {
      for (let k = 0; k < j.tendrils.length; k++) {
        updateTendril(j.tendrils[k], j.x, j.y, wx * 0.5, wy * 0.5, dt, {
          gravity: 78,
          damp: 0.88,
          windTendril: 0.95,
          iters: qualityTendril < 0.6 ? 4 : 6,
        });
      }
    }

    // --- wrap / respawn from the dispenser ---
    if (j.x < -margin) j.x += W + margin * 2;
    else if (j.x > W + margin) j.x -= W + margin * 2;
    if (j.y < -margin || j.y > H + margin) respawn(j);

    // deposit this bell's flash so neighbours can "see" it
    if (r.fired) {
      const cx = Math.min(gridCols - 1, Math.max(0, (j.x / gridCell) | 0));
      const cy = Math.min(gridRows - 1, Math.max(0, (j.y / gridCell) | 0));
      flashGrid[cy * gridCols + cx] += 1;
    }
  }

  // Pass 2: each bell advances its phase by ε for the flashes it can see.
  if (params.epsilon > 0) {
    for (let n = 0; n < jellies.length; n++) {
      const j = jellies[n];
      const cx = Math.min(gridCols - 1, Math.max(0, (j.x / gridCell) | 0));
      const cy = Math.min(gridRows - 1, Math.max(0, (j.y / gridCell) | 0));
      let seen = 0;
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        if (gy < 0 || gy >= gridRows) continue;
        for (let gx = cx - 1; gx <= cx + 1; gx++) {
          if (gx < 0 || gx >= gridCols) continue;
          seen += flashGrid[gy * gridCols + gx];
        }
      }
      if (seen > 0) {
        // one flash of its own may sit in the cell; ignore self-only nudge
        const strength = params.epsilon * Math.min(1, seen / 3);
        if (strength > 0) {
          const c = couple(j.phase, strength);
          j.phase = c.phase;
          if (c.fired) j.lastFlash = 0;
        }
      }
    }
  }
}

function respawn(j) {
  j.x = dispenserX();
  j.y = dispenserY();
  j.vx = randRange(rng, -10, 10);
  j.vy = -randRange(rng, 24, 46);
  for (let k = 0; k < j.tendrils.length; k++) {
    const t = j.tendrils[k];
    for (let i = 0; i < t.pts.length; i++) {
      t.pts[i].x = j.x;
      t.pts[i].y = j.y + i * t.segLen;
      t.pts[i].px = t.pts[i].x;
      t.pts[i].py = t.pts[i].y;
    }
  }
}

// Release / retire jellies toward the desired population.
function managePopulation() {
  const desired = Math.min(params.count, autoMax);
  if (params.releasing && jellies.length < desired) {
    // release a gentle rhythm rather than a burst
    const add = Math.min(desired - jellies.length, Math.max(1, Math.ceil(desired / 90)));
    for (let i = 0; i < add; i++) jellies.push(makeOne());
  } else if (jellies.length > desired) {
    jellies.length = desired; // trim (auto-degrade or lowered count)
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function lerp(a, b, t) { return a + (b - a) * t; }

function render() {
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // subtle dispenser glow at the bottom
  ctx.globalCompositeOperation = 'lighter';
  drawSprite(spriteWarm, W / 2, H + 20, 120, 0.05 * params.glow);

  const glow = params.glow;
  const sparkMix = params.spark;
  const nSprite = spriteCool; // cool tint sprite for spark
  const ms = motionScale();
  const swayAmp = 6 * (0.3 + 0.7 * ms); // undulation amplitude (visual only)
  const swaySpeed = simTime * 1.9 * (ms || 0.06);
  const sx = new Float32Array(16);
  const sy = new Float32Array(16);

  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // === Tendril strands, batched into TWO stroke calls for the whole swarm ===
  // (subpaths accumulate into one path, so cost scales with total segments, not
  // with stroke-call count — this is what lets it reach thousands of units.)
  if (qualityTendril > 0) {
    for (let pass = 0; pass < 2; pass++) {
      if (pass === 0) { ctx.strokeStyle = 'rgba(255, 168, 78, 0.14)'; ctx.lineWidth = 3.0 * glow; ctx.globalAlpha = 0.55; }
      else { ctx.strokeStyle = 'rgba(255, 206, 132, 0.5)'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.72; }
      ctx.beginPath();
      for (let n = 0; n < jellies.length; n++) {
        const j = jellies[n];
        for (let k = 0; k < j.tendrils.length; k++) {
          const pts = j.tendrils[k].pts;
          const last = pts.length - 1;
          const kPhase = j.waveOffset + k * 1.7;
          for (let i = 0; i <= last; i++) {
            const tip = i / last;
            const a = pts[i > 0 ? i - 1 : 0];
            const b = pts[i < last ? i + 1 : last];
            let tx = b.x - a.x, ty = b.y - a.y;
            const tl = Math.hypot(tx, ty) || 1;
            tx /= tl; ty /= tl;
            const s = Math.sin(swaySpeed - i * 0.9 + kPhase) * swayAmp * tip;
            sx[i] = pts[i].x - ty * s;
            sy[i] = pts[i].y + tx * s;
          }
          ctx.moveTo(sx[0], sy[0]);
          for (let i = 1; i < last; i++) {
            ctx.quadraticCurveTo(sx[i], sy[i], (sx[i] + sx[i + 1]) * 0.5, (sy[i] + sy[i + 1]) * 0.5);
          }
          ctx.lineTo(sx[last], sy[last]);
        }
      }
      ctx.stroke();
    }
  }

  // === Flowing light crests + bells (sprite draws, naturally cheap) ===
  for (let n = 0; n < jellies.length; n++) {
    const j = jellies[n];
    const flash = jellyFlash(j, 0.42);
    const birthFade = Math.min(1, j.birth * 1.4);
    const charge = j.phase * j.phase * j.phase; // swelling "charge" glow before a blink

    // travelling light flowing DOWN each tendril
    if (qualityTendril > 0.35 && j.tendrils.length) {
      const crests = qualityTendril > 0.7 ? 2 : 1;
      for (let k = 0; k < j.tendrils.length; k++) {
        const pts = j.tendrils[k].pts;
        const last = pts.length - 1;
        for (let cI = 0; cI < crests; cI++) {
          const slide = (((simTime * j.waveSpeed) + j.waveOffset / (Math.PI * 2) + cI / crests) % 1 + 1) % 1;
          const fpos = slide * last;
          const i0 = Math.min(last - 1, fpos | 0);
          const fr = fpos - i0;
          const px = lerp(pts[i0].x, pts[i0 + 1].x, fr);
          const py = lerp(pts[i0].y, pts[i0 + 1].y, fr);
          const b = (0.9 - slide * 0.4) * birthFade; // brighter near the bell, fades toward the tip
          drawSprite(spriteAmber, px, py, 5.0 * glow, 0.5 * b * glow);
          drawSprite(spriteWhite, px, py, 1.8 * glow, 0.45 * b);
        }
      }
    }

    // --- bell: soft amber dome + charging glow + sharp capacitor spark-flash ---
    const r0 = j.size;
    const bell = 0.42 + 0.34 * charge; // always softly aglow; swells before a blink
    drawSprite(spriteAmber, j.x, j.y, r0 * (2.4 + flash * 3.0) * glow,
      (0.4 * bell + 0.7 * flash) * glow * birthFade);
    drawSprite(spriteWarm, j.x, j.y, r0 * (1.2 + flash * 1.4) * glow,
      (0.55 * bell + 0.8 * flash) * birthFade);
    if (flash > 0.02) {
      drawSprite(nSprite, j.x, j.y, r0 * (0.9 + flash * 1.8) * glow,
        sparkMix * flash * birthFade);
      drawSprite(spriteWhite, j.x, j.y, r0 * (0.5 + flash * 1.0),
        (0.55 + 0.45 * sparkMix) * flash * birthFade);
    }
    ctx.globalAlpha = Math.min(1, (0.45 * bell + flash) * birthFade);
    ctx.fillStyle = flash > 0.3
      ? `rgb(${Math.round(lerp(255, 205, sparkMix))},${Math.round(lerp(238, 230, sparkMix))},${Math.round(lerp(205, 255, sparkMix))})`
      : 'rgb(255, 214, 150)';
    ctx.beginPath();
    ctx.arc(j.x, j.y, Math.max(0.7, r0 * 0.34), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Main loop: fixed-timestep accumulator + rAF render + FPS / auto-degrade
// ---------------------------------------------------------------------------
let acc = 0;
let last = performance.now();
let fpsEMA = 60;
let degradeCooldown = 0;

const fpsEl = document.getElementById('fps');
const countEl = document.getElementById('countReadout');
const syncEl = document.getElementById('syncReadout');
let hudTimer = 0;

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25; // tab was backgrounded; don't spiral
  const inst = 1 / Math.max(1e-3, dt);
  fpsEMA = fpsEMA * 0.9 + inst * 0.1;

  managePopulation();

  if (!params.frozen) {
    acc += dt;
    let steps = 0;
    while (acc >= SIM_DT && steps < 5) {
      step(SIM_DT);
      acc -= SIM_DT;
      steps++;
    }
    if (acc > SIM_DT) acc = 0; // shed backlog
  } else {
    // frozen: keep the blink oscillator alive but hold positions
    simTime += dt * 0.0;
  }

  render();

  // --- auto-degrade / recover based on smoothed FPS ---
  degradeCooldown -= dt;
  if (degradeCooldown <= 0) {
    if (fpsEMA < 48 && jellies.length > 60) {
      autoMax = Math.max(60, Math.floor(jellies.length * 0.85));
      if (fpsEMA < 40 && qualityTendril > 0.3) qualityTendril = 0.3;
      else if (fpsEMA < 44 && qualityTendril > 0.6) qualityTendril = 0.6;
      degradeCooldown = 0.6;
    } else if (fpsEMA > 57) {
      // recover headroom slowly
      autoMax = Math.min(3000, autoMax + 20);
      if (qualityTendril < 1) qualityTendril = Math.min(1, qualityTendril + 0.05);
      degradeCooldown = 0.4;
    }
  }

  // --- HUD (throttled) ---
  hudTimer += dt;
  if (hudTimer > 0.25) {
    hudTimer = 0;
    fpsEl.textContent = `${Math.round(fpsEMA)} FPS`;
    const capped = jellies.length < params.count ? ' (capped)' : '';
    countEl.textContent = `${jellies.length} jellyfish${capped}`;
    // coherence readout — measured, shown as text + a bar glyph (not colour-only)
    let r = 0;
    if (jellies.length > 1) {
      const phases = new Array(jellies.length);
      for (let i = 0; i < jellies.length; i++) phases[i] = jellies[i].phase;
      r = orderParameter(phases);
    }
    const bars = Math.round(r * 10);
    syncEl.textContent = `sync ${(r * 100) | 0}% ${'█'.repeat(bars)}${'░'.repeat(10 - bars)}`;
  }

  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Controls wiring
// ---------------------------------------------------------------------------
function bindRange(id, outId, fmt, apply) {
  const el = document.getElementById(id);
  const out = document.getElementById(outId);
  const update = () => {
    const v = parseFloat(el.value);
    if (out) out.textContent = fmt(v);
    apply(v);
  };
  el.addEventListener('input', update);
  update();
}

bindRange('count', 'countOut', (v) => `${v | 0}`, (v) => { params.count = v | 0; });
bindRange('wind', 'windOut', (v) => `${v | 0}`, (v) => { params.wind = v; });
bindRange('period', 'periodOut', (v) => `${v.toFixed(1)} s`, (v) => {
  params.T = v;
  for (const j of jellies) j.T = v;
});
bindRange('coupling', 'couplingOut', (v) => v.toFixed(3), (v) => { params.epsilon = v; });
bindRange('tcount', 'tcountOut', (v) => `${v | 0}`, (v) => {
  params.tendrilCount = v | 0;
  for (const j of jellies) rebuildTendrils(j);
});
bindRange('tlen', 'tlenOut', (v) => `${v | 0}`, (v) => {
  params.tendrilLen = v;
  for (const j of jellies) rebuildTendrils(j);
});
bindRange('spark', 'sparkOut', (v) => `${v | 0}%`, (v) => { params.spark = v / 100; });
bindRange('glow', 'glowOut', (v) => v.toFixed(2), (v) => { params.glow = v; });

const motionEl = document.getElementById('motion');
motionEl.addEventListener('change', () => { params.motion = motionEl.value; });

const startBtn = document.getElementById('startBtn');
const statusLine = document.getElementById('statusLine');
startBtn.addEventListener('click', () => {
  params.releasing = !params.releasing;
  startBtn.setAttribute('aria-pressed', String(params.releasing));
  startBtn.textContent = params.releasing ? 'Pause releasing' : 'Start releasing';
  statusLine.textContent = params.releasing
    ? 'Releasing sky-jellyfish from the dispenser…'
    : 'Dispenser stopped. Drifting continues.';
});

const pauseBtn = document.getElementById('pauseBtn');
pauseBtn.addEventListener('click', () => {
  params.frozen = !params.frozen;
  pauseBtn.setAttribute('aria-pressed', String(params.frozen));
  pauseBtn.textContent = params.frozen ? 'Resume scene' : 'Freeze scene';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  resetSky();
  statusLine.textContent = 'A fresh sky. Releasing…';
  params.releasing = true;
  startBtn.setAttribute('aria-pressed', 'true');
  startBtn.textContent = 'Pause releasing';
});

const panelToggle = document.getElementById('panelToggle');
const panel = document.getElementById('controls');
panelToggle.addEventListener('click', () => {
  const hidden = panel.hasAttribute('hidden');
  if (hidden) panel.removeAttribute('hidden');
  else panel.setAttribute('hidden', '');
  panelToggle.setAttribute('aria-expanded', String(hidden));
  panelToggle.textContent = hidden ? 'Hide controls' : 'Show controls';
});

// Respect the OS reduced-motion preference on first load.
if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  params.motion = 'reduced';
  motionEl.value = 'reduced';
}

// ---------------------------------------------------------------------------
// Go
// ---------------------------------------------------------------------------
resize();
seedSpread(70); // a first handful across the whole sky, so it is alive at once
requestAnimationFrame(frame);
