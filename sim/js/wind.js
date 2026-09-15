// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CLSOFTLAB (씨엘소프트랩), Dr. Lee Il-guk (이일국)
//
// wind.js — a smooth, gentle, time-varying 2D wind field.
//
// Built from a handful of summed sine/cosine "flow" components (layered value
// noise in spirit). Deterministic: a given seed always produces the same field,
// so the same show can be replayed exactly. Pure, dependency-light (only rng.js).
//
// Design goal (spec F1, §8): the wind does the choreography. The field must feel
// like slow curling air — swirls and lanes that drift over time and never repeat.

import { mulberry32 } from './rng.js';

/**
 * Build an immutable wind field description.
 * @param {number} seed
 * @param {object} [opts]
 *   octaves    number of summed components (default 5)
 *   baseFreq   spatial base frequency in 1/px (default 0.0011)
 *   timeScale  how fast the field evolves (default 0.35)
 * @returns {{seed:number, comps:Array, norm:number, curl:number}}
 */
export function createWindField(seed, opts = {}) {
  const rng = mulberry32(seed >>> 0);
  const octaves = opts.octaves ?? 5;
  const baseFreq = opts.baseFreq ?? 0.0011;
  const timeScale = opts.timeScale ?? 0.35;

  const comps = [];
  for (let i = 0; i < octaves; i++) {
    const freq = baseFreq * (0.5 + i * 0.7);
    comps.push({
      fx: freq * (0.6 + 0.8 * rng()),
      fy: freq * (0.6 + 0.8 * rng()),
      phx: rng() * Math.PI * 2,
      phy: rng() * Math.PI * 2,
      // temporal drift of each component (slow)
      tf: (0.12 + 0.55 * rng()) * timeScale,
      // amplitude falls off for higher octaves (1/f-ish)
      amp: 1 / (i * 0.9 + 1),
      // rotation gives the field a curling, flow-like character
      dir: rng() * Math.PI * 2,
    });
  }
  const norm = comps.reduce((s, c) => s + c.amp, 0) || 1;
  return { seed: seed >>> 0, comps, norm, curl: opts.curl ?? 1 };
}

/**
 * Sample the normalised wind velocity at (x, y) and time t.
 * Returns a vector with components roughly in [-1, 1]; scale it in the caller.
 * Pure: depends only on the field, x, y, t.
 * @returns {{x:number, y:number}}
 */
export function windAt(field, x, y, t) {
  let vx = 0;
  let vy = 0;
  const comps = field.comps;
  for (let i = 0; i < comps.length; i++) {
    const c = comps[i];
    const s = Math.sin(x * c.fx + y * c.fy * 0.5 + c.phx + t * c.tf);
    const s2 = Math.cos(x * c.fx * 0.5 - y * c.fy + c.phy + t * c.tf * 0.83);
    const cd = Math.cos(c.dir);
    const sd = Math.sin(c.dir);
    // rotate the (s, s2) pair by dir → curling flow rather than axis-aligned waves
    vx += c.amp * (cd * s - sd * s2 * field.curl);
    vy += c.amp * (sd * s + cd * s2 * field.curl);
  }
  return { x: vx / field.norm, y: vy / field.norm };
}
