// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CLSOFTLAB (씨엘소프트랩), Dr. Lee Il-guk (이일국)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../js/rng.js';
import {
  createJelly,
  updateJelly,
  updateTendril,
  tendrilLength,
  flowWave,
  sparkBrightness,
} from '../js/jelly.js';

function makeJelly(seed = 5) {
  const rng = mulberry32(seed);
  return createJelly({
    x: 400,
    y: 300,
    id: 1,
    rng,
    T: 1.5,
    tendrilCount: 6,
    tendrilSegs: 8,
    tendrilLen: 80,
  });
}

test('a jelly is created with the requested tendrils, each hanging from the bell', () => {
  const j = makeJelly();
  assert.equal(j.tendrils.length, 6);
  for (const t of j.tendrils) {
    assert.equal(t.pts.length, 9);
    assert.ok(Math.abs(t.pts[0].x - j.x) < 1e-9 && Math.abs(t.pts[0].y - j.y) < 1e-9,
      'tendril head starts at the bell');
  }
});

test('tendril head stays attached to the bell after updates in wind', () => {
  const j = makeJelly();
  const dt = 1 / 60;
  for (let i = 0; i < 600; i++) {
    const wx = Math.sin(i * 0.05) * 30;
    const wy = Math.cos(i * 0.03) * 12;
    updateJelly(j, wx, wy, dt);
  }
  for (const t of j.tendrils) {
    const head = t.pts[0];
    assert.ok(Math.abs(head.x - j.x) < 1e-6 && Math.abs(head.y - j.y) < 1e-6,
      `head detached from bell: (${head.x},${head.y}) vs (${j.x},${j.y})`);
  }
});

test('tendril total length stays bounded near its rest length under strong wind', () => {
  const j = makeJelly();
  const dt = 1 / 60;
  const rest = j.segLen * 8; // nSeg segments
  for (let i = 0; i < 1200; i++) {
    updateJelly(j, 200 * Math.sin(i * 0.2), 80, dt); // gusty
  }
  for (const t of j.tendrils) {
    const L = tendrilLength(t);
    assert.ok(L > rest * 0.6 && L < rest * 1.25,
      `tendril length ${L} strayed from rest ${rest}`);
    for (const p of t.pts) {
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), 'tendril point went non-finite');
    }
  }
});

test('a still tendril hangs down under gravity (tip below the head)', () => {
  const rng = mulberry32(3);
  const j = createJelly({ x: 100, y: 100, rng, tendrilCount: 1, tendrilSegs: 6, tendrilLen: 60 });
  const t = j.tendrils[0];
  for (let i = 0; i < 400; i++) updateTendril(t, 100, 100, 0, 0, 1 / 60);
  const tip = t.pts[t.pts.length - 1];
  assert.ok(tip.y > t.pts[0].y + 20, `tip should sag below head, tip.y=${tip.y}`);
  assert.ok(Math.abs(tip.x - 100) < 15, 'still tendril should hang roughly straight');
});

test('flowWave is a bounded travelling wave that moves over time', () => {
  for (let i = 0; i < 50; i++) {
    const v = flowWave(i / 50, 1.3, 0.7, 0.5);
    assert.ok(v >= 0 && v <= 1, `flowWave out of range: ${v}`);
  }
  // a fixed point on the tendril changes brightness as time advances
  const a = flowWave(0.4, 0.0, 0.7, 0.0);
  const b = flowWave(0.4, 0.5, 0.7, 0.0);
  assert.ok(Math.abs(a - b) > 0.05, 'wave should travel (brightness changes in time)');
});

test('spark flash peaks sharply then decays (capacitor discharge profile)', () => {
  const dur = 0.42;
  assert.equal(sparkBrightness(-0.1, dur), 0, 'dark before the flash');
  const rise = 0.05 * dur;

  // sample the profile densely and find the peak
  let peakT = 0;
  let peakV = -1;
  for (let ts = 0; ts <= 1.5; ts += 0.001) {
    const v = sparkBrightness(ts, dur);
    if (v > peakV) { peakV = v; peakT = ts; }
  }
  assert.ok(Math.abs(peakV - 1) < 1e-6, `peak brightness should be ~1, got ${peakV}`);
  assert.ok(Math.abs(peakT - rise) < 0.01, `peak should be near the rise time, at ${peakT}`);

  // monotonic decay after the peak
  let prev = sparkBrightness(rise, dur);
  for (let ts = rise + 0.01; ts <= 1.5; ts += 0.01) {
    const v = sparkBrightness(ts, dur);
    assert.ok(v <= prev + 1e-9, `brightness must not increase after the peak at ${ts}`);
    prev = v;
  }
  // and it is dark again well after
  assert.ok(sparkBrightness(1.4, dur) < 0.02, 'flash should fade to near-dark');
});

test('bell drifts with the wind and keeps soft (bounded) velocity', () => {
  const j = makeJelly();
  const dt = 1 / 60;
  for (let i = 0; i < 300; i++) updateJelly(j, 40, 0, dt);
  assert.ok(j.x > 400, 'bell should drift downwind (+x)');
  assert.ok(Math.hypot(j.vx, j.vy) < 80, 'velocity should stay soft, not explode');
});
