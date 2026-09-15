// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CLSOFTLAB (씨엘소프트랩), Dr. Lee Il-guk (이일국)
//
// sync.js — pulse-coupled oscillators, Mirollo–Strogatz style (spec §5).
//
// Each unit has a phase that ramps 0→1 over a period T, flashes at 1, and
// resets. When a unit *sees* a neighbour flash, it nudges its own phase forward
// by a coupling strength ε. The nudge is applied in a concave "state" space
// (u = f(phase)); this concavity is precisely what makes a population of such
// oscillators converge to synchrony (Mirollo & Strogatz, 1990). No leader, no
// coordinator — order emerges from light alone.
//
// Everything here is a pure, seed-free function so it is trivially unit-testable
// and shared verbatim between the simulator and the reference firmware model.

/**
 * Concave firing map: phase → internal state, f(0)=0, f(1)=1, f concave for b>0.
 * b is the "dissipation"; larger b = more concave = faster synchronisation.
 */
export function stateOf(phase, b = 3) {
  if (b <= 1e-6) return phase; // linear limit
  return Math.log1p((Math.exp(b) - 1) * phase) / b;
}

/** Inverse of stateOf: state → phase. */
export function phaseOfState(u, b = 3) {
  if (b <= 1e-6) return u;
  return (Math.exp(b * u) - 1) / (Math.exp(b) - 1);
}

/**
 * Advance a single phase by dt over period T (free-running ramp).
 * @returns {{phase:number, fired:boolean}} fired=true if it crossed threshold.
 */
export function ramp(phase, dt, T) {
  let p = phase + dt / T;
  let fired = false;
  if (p >= 1) {
    p -= Math.floor(p); // wrap; supports large dt without losing >1 flash
    fired = true;
  }
  return { phase: p, fired };
}

/**
 * Apply one received pulse of strength ε to a phase (excitatory coupling).
 * Works in state space then maps back; may push the oscillator over threshold
 * (absorption / immediate re-fire), which is how cascades spread synchrony.
 * @returns {{phase:number, fired:boolean}}
 */
export function couple(phase, epsilon, b = 3) {
  const u = stateOf(phase, b) + epsilon;
  if (u >= 1) return { phase: 0, fired: true };
  return { phase: phaseOfState(u, b), fired: false };
}

/**
 * Kuramoto order parameter r ∈ [0,1] over a set of phases.
 * r≈0 → scattered, r≈1 → fully synchronised. Used to *measure* convergence.
 */
export function orderParameter(phases) {
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < phases.length; i++) {
    const a = 2 * Math.PI * phases[i];
    sx += Math.cos(a);
    sy += Math.sin(a);
  }
  const n = phases.length || 1;
  return Math.hypot(sx / n, sy / n);
}

/**
 * Circular spread (std-dev-like) of a set of phases, in [0, ~0.5].
 * Smaller = tighter clump. spread = sqrt(-2 ln r) / (2π), clamped.
 */
export function phaseSpread(phases) {
  const r = Math.max(1e-9, orderParameter(phases));
  return Math.min(0.5, Math.sqrt(-2 * Math.log(r)) / (2 * Math.PI));
}

/**
 * Reference all-to-all step (used by tests and small demos): ramp every
 * oscillator, then let every fired oscillator pulse all the others, resolving
 * cascades (an oscillator pushed over threshold fires and pulses in turn).
 *
 * Mutates nothing; returns fresh arrays.
 * @param {number[]} phases
 * @returns {{phases:number[], fired:boolean[]}}
 */
export function stepAllToAll(phases, dt, T, epsilon, b = 3) {
  const n = phases.length;
  const out = new Array(n);
  const fired = new Array(n).fill(false);
  const queue = [];

  for (let i = 0; i < n; i++) {
    const r = ramp(phases[i], dt, T);
    out[i] = r.phase;
    if (r.fired) {
      fired[i] = true;
      out[i] = 0;
      queue.push(i);
    }
  }

  // Resolve cascade. Each oscillator can fire at most once per step, so this
  // terminates in at most n rounds.
  while (queue.length) {
    const src = queue.shift();
    for (let j = 0; j < n; j++) {
      if (j === src || fired[j]) continue;
      const c = couple(out[j], epsilon, b);
      out[j] = c.phase;
      if (c.fired) {
        fired[j] = true;
        out[j] = 0;
        queue.push(j);
      }
    }
  }
  return { phases: out, fired };
}
