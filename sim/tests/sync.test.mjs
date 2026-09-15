// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CLSOFTLAB (씨엘소프트랩), Dr. Lee Il-guk (이일국)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../js/rng.js';
import {
  ramp,
  couple,
  stateOf,
  phaseOfState,
  orderParameter,
  phaseSpread,
  stepAllToAll,
} from '../js/sync.js';

test('ramp advances phase and fires exactly at threshold crossing', () => {
  let p = 0;
  let fires = 0;
  const T = 1.0;
  const dt = 1 / 60;
  const steps = Math.round(3 * T * 60); // ~3 periods
  for (let i = 0; i < steps; i++) {
    const r = ramp(p, dt, T);
    p = r.phase;
    if (r.fired) fires++;
  }
  assert.ok(fires === 2 || fires === 3, `expected ~3 fires, got ${fires}`);
});

test('stateOf / phaseOfState are inverse and monotone; f is concave', () => {
  const b = 3;
  for (let i = 0; i <= 10; i++) {
    const p = i / 10;
    assert.ok(Math.abs(phaseOfState(stateOf(p, b), b) - p) < 1e-9);
  }
  // concavity: f(midpoint) > average of endpoints
  const mid = stateOf(0.5, b);
  const avg = (stateOf(0, b) + stateOf(1, b)) / 2;
  assert.ok(mid > avg, 'firing map must be concave (drives synchrony)');
});

test('couple nudges phase forward and can absorb over threshold', () => {
  const c1 = couple(0.5, 0.1, 3);
  assert.ok(c1.phase > 0.5 && !c1.fired);
  const c2 = couple(0.98, 0.9, 3); // big kick → fires/absorbs
  assert.ok(c2.fired && c2.phase === 0);
});

test('coupled oscillators converge to synchrony within N periods (spread decreases)', () => {
  const rng = mulberry32(31337);
  const N = 60;
  const T = 1.2;
  const dt = 1 / 120;
  const eps = 0.09;
  let phases = Array.from({ length: N }, () => rng());

  const startSpread = phaseSpread(phases);
  const startR = orderParameter(phases);

  // run for ~40 periods
  const steps = Math.round(40 * T / dt);
  let minR = startR;
  let maxR = startR;
  for (let i = 0; i < steps; i++) {
    phases = stepAllToAll(phases, dt, T, eps).phases;
    const r = orderParameter(phases);
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
  }

  const endSpread = phaseSpread(phases);
  const endR = orderParameter(phases);

  assert.ok(startR < 0.5, `random start should be incoherent, r0=${startR}`);
  assert.ok(endR > 0.9, `should reach near-synchrony, rEnd=${endR}`);
  assert.ok(endSpread < startSpread * 0.35,
    `phase spread should shrink markedly: ${startSpread} → ${endSpread}`);
});

test('order parameter is 1 for identical phases and low for a uniform spread', () => {
  assert.ok(Math.abs(orderParameter([0.3, 0.3, 0.3, 0.3]) - 1) < 1e-9);
  const spread = [];
  for (let i = 0; i < 100; i++) spread.push(i / 100);
  assert.ok(orderParameter(spread) < 0.05, 'uniform phases → near-zero coherence');
});

test('convergence is monotone-ish: coherence at the end exceeds the start for several seeds', () => {
  for (const seed of [1, 2, 3, 7, 100]) {
    const rng = mulberry32(seed);
    const N = 40;
    const T = 1.0;
    const dt = 1 / 100;
    let phases = Array.from({ length: N }, () => rng());
    const r0 = orderParameter(phases);
    const steps = Math.round(50 * T / dt);
    for (let i = 0; i < steps; i++) phases = stepAllToAll(phases, dt, T, 0.1).phases;
    const r1 = orderParameter(phases);
    assert.ok(r1 > r0 && r1 > 0.85, `seed ${seed}: r ${r0} → ${r1}`);
  }
});
