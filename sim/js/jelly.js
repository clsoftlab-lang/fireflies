// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CLSOFTLAB (씨엘소프트랩), Dr. Lee Il-guk (이일국)
//
// jelly.js — a sky-jellyfish (해파리): a helium "bell" that drifts on the wind
// with soft inertia, and several feather-light tendrils that hang, sway and
// trail behind the bell like verlet strands (spec §3.1). Light flows down each
// tendril as a slow travelling wave, and the bell carries an amber base glow
// plus an occasional sharp, capacitor-boosted spark-flash (spec §5.1).
//
// Pure simulation + math only — no canvas, no DOM. Rendering lives in main.js.
// Functions take an explicit sampled wind vector so they stay testable.

import { randRange, randInt } from './rng.js';

/** Build one verlet tendril hanging straight down from (x, y). */
export function createTendril(x, y, nSeg, segLen) {
  const pts = new Array(nSeg + 1);
  for (let i = 0; i <= nSeg; i++) {
    const py = y + i * segLen;
    pts[i] = { x, y: py, px: x, py };
  }
  return { pts, nSeg, segLen };
}

/**
 * Create a sky-jellyfish.
 * @param {object} o  {x, y, id, rng, T, phase, tendrilCount, tendrilSegs, tendrilLen, size}
 */
export function createJelly(o) {
  const rng = o.rng;
  const tendrilCount = o.tendrilCount ?? 5;
  const tendrilSegs = o.tendrilSegs ?? 7;
  const tendrilLen = o.tendrilLen ?? 70;
  const segLen = tendrilLen / tendrilSegs;

  const tendrils = new Array(tendrilCount);
  for (let k = 0; k < tendrilCount; k++) {
    tendrils[k] = createTendril(o.x, o.y, tendrilSegs, segLen);
  }

  return {
    id: o.id ?? 0,
    x: o.x,
    y: o.y,
    vx: 0,
    vy: 0,
    T: o.T ?? 1.6,
    phase: o.phase ?? (rng ? rng() : 0),
    tendrils,
    tendrilLen,
    segLen,
    size: o.size ?? (rng ? randRange(rng, 5, 9) : 7),
    // seconds since last spark-flash (large = long ago / dark)
    lastFlash: 10,
    // per-jelly phase offset so travelling waves don't march in lockstep
    waveOffset: rng ? rng() * Math.PI * 2 : 0,
    waveSpeed: rng ? randRange(rng, 0.5, 0.9) : 0.7,
    swayPhase: rng ? rng() * Math.PI * 2 : 0,
    // Independent slow "wander" so identically-placed bells still drift apart —
    // a smooth wind field alone never disperses a clump. Plus a little variation
    // in how strongly each bell responds to the wind and its residual buoyancy.
    wa: rng ? rng() * Math.PI * 2 : 0,
    wb: rng ? rng() * Math.PI * 2 : 0,
    wf1: rng ? randRange(rng, 0.09, 0.22) : 0.14,
    wf2: rng ? randRange(rng, 0.06, 0.17) : 0.1,
    windResp: rng ? randRange(rng, 0.8, 1.2) : 1,
    buoy: rng ? randRange(rng, -1, 1) : 0,
    alive: true,
    // fade-in when freshly released from the dispenser
    birth: 0,
  };
}

/**
 * Advect the bell by the wind with light inertia + drag, so motion is soft and
 * never snappy. `windX/windY` are the wind velocity (px/s) at the bell.
 */
export function updateBell(j, windX, windY, dt, opts = {}) {
  const drag = opts.drag ?? 1.7; // how quickly velocity chases the wind
  const lift = opts.lift ?? 3; // gentle residual buoyancy (px/s^2 upward)
  const k = Math.min(1, drag * dt);
  j.vx += (windX - j.vx) * k;
  j.vy += (windY - j.vy) * k - lift * dt;
  j.x += j.vx * dt;
  j.y += j.vy * dt;
  j.birth += dt;
}

/**
 * Integrate one tendril: pin the head to the bell, verlet-integrate the free
 * points under gravity + wind + damping, then relax segment-length constraints
 * so the strand stays attached and its total length stays bounded.
 */
export function updateTendril(t, bx, by, windX, windY, dt, opts = {}) {
  const pts = t.pts;
  const damp = opts.damp ?? 0.86;
  const gravity = opts.gravity ?? 46;
  const windTendril = opts.windTendril ?? 1.15;
  const iters = opts.iters ?? 6;
  const n = pts.length;
  const dt2 = dt * dt;

  // pin head to the bell
  pts[0].x = bx;
  pts[0].y = by;

  // verlet integration of free points
  for (let i = 1; i < n; i++) {
    const p = pts[i];
    const tip = i / (n - 1); // 0 at head → 1 at tip; wind bites more at the tip
    const vx = (p.x - p.px) * damp;
    const vy = (p.y - p.py) * damp;
    p.px = p.x;
    p.py = p.y;
    p.x += vx + windX * windTendril * tip * dt2;
    p.y += vy + (gravity + windY * windTendril * tip) * dt2;
  }

  // satisfy distance constraints (Jakobsen relaxation)
  for (let it = 0; it < iters; it++) {
    pts[0].x = bx;
    pts[0].y = by;
    for (let i = 0; i < n - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      const diff = (d - t.segLen) / d;
      if (i === 0) {
        // head pinned: move only the child
        b.x -= dx * diff;
        b.y -= dy * diff;
      } else {
        a.x += dx * diff * 0.5;
        a.y += dy * diff * 0.5;
        b.x -= dx * diff * 0.5;
        b.y -= dy * diff * 0.5;
      }
    }
  }
  pts[0].x = bx;
  pts[0].y = by;
}

/** Total tendril length (sum of segment lengths) — used to assert bounds. */
export function tendrilLength(t) {
  let s = 0;
  for (let i = 0; i < t.pts.length - 1; i++) {
    s += Math.hypot(t.pts[i + 1].x - t.pts[i].x, t.pts[i + 1].y - t.pts[i].y);
  }
  return s;
}

/** Advance every part of a jelly by dt (bell + all tendrils + flash timer). */
export function updateJelly(j, windX, windY, dt, opts = {}) {
  updateBell(j, windX, windY, dt, opts);
  for (let k = 0; k < j.tendrils.length; k++) {
    updateTendril(j.tendrils[k], j.x, j.y, windX, windY, dt, opts);
  }
  j.lastFlash += dt;
}

/**
 * Travelling-wave brightness flowing DOWN a tendril (top→bottom), in [0,1].
 * @param {number} tipFrac  0 at bell, 1 at tip.
 */
export function flowWave(tipFrac, t, speed, waveOffset = 0, waveLen = 0.85) {
  const phase = 2 * Math.PI * (tipFrac / waveLen - t * speed) + waveOffset;
  const v = 0.5 + 0.5 * Math.sin(phase);
  return v * v; // sharpen the crest so the "pulse" reads clearly
}

/**
 * Capacitor-boosted spark-flash profile (spec §5.1): dark, a very fast rise to
 * a sharp peak, then an exponential discharge tail. Returns brightness in [0,1].
 * @param {number} tSince  seconds since the flash began.
 * @param {number} dur     nominal flash duration (s).
 */
export function sparkBrightness(tSince, dur = 0.42) {
  if (tSince < 0) return 0;
  const rise = 0.05 * dur; // snap up
  if (tSince < rise) return tSince / rise;
  return Math.exp(-(tSince - rise) / (dur * 0.26));
}

/** Convenience: current spark brightness of a jelly given its flash duration. */
export function jellyFlash(j, dur = 0.42) {
  return sparkBrightness(j.lastFlash, dur);
}
