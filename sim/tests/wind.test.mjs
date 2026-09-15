// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CLSOFTLAB (씨엘소프트랩), Dr. Lee Il-guk (이일국)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWindField, windAt } from '../js/wind.js';

test('wind field is deterministic: same seed → identical samples over space/time', () => {
  const a = createWindField(2024);
  const b = createWindField(2024);
  for (let i = 0; i < 200; i++) {
    const x = (i * 37) % 1920;
    const y = (i * 53) % 1080;
    const t = i * 0.13;
    const va = windAt(a, x, y, t);
    const vb = windAt(b, x, y, t);
    assert.equal(va.x, vb.x);
    assert.equal(va.y, vb.y);
  }
});

test('different seeds give a different field', () => {
  const a = createWindField(1);
  const b = createWindField(2);
  let diff = 0;
  for (let i = 0; i < 50; i++) {
    const va = windAt(a, i * 20, i * 10, i * 0.1);
    const vb = windAt(b, i * 20, i * 10, i * 0.1);
    if (Math.abs(va.x - vb.x) > 1e-6 || Math.abs(va.y - vb.y) > 1e-6) diff++;
  }
  assert.ok(diff > 40, `fields should differ, only ${diff}/50 samples differed`);
});

test('wind magnitude is bounded (normalised roughly to unit scale)', () => {
  const f = createWindField(77);
  let maxMag = 0;
  for (let x = 0; x < 2000; x += 50) {
    for (let y = 0; y < 1200; y += 50) {
      for (let t = 0; t < 5; t += 1) {
        const v = windAt(f, x, y, t);
        maxMag = Math.max(maxMag, Math.hypot(v.x, v.y));
      }
    }
  }
  assert.ok(maxMag <= 2.0, `magnitude too large: ${maxMag}`);
  assert.ok(maxMag > 0.2, `field is suspiciously flat: ${maxMag}`);
});

test('wind is smooth: nearby samples are close (no discontinuities)', () => {
  const f = createWindField(5);
  const t = 3.2;
  for (let k = 0; k < 100; k++) {
    const x = k * 15;
    const y = 400 + k * 3;
    const v0 = windAt(f, x, y, t);
    const v1 = windAt(f, x + 1, y, t);
    const d = Math.hypot(v1.x - v0.x, v1.y - v0.y);
    assert.ok(d < 0.05, `spatial jump too big at x=${x}: ${d}`);
  }
});

test('wind evolves over time (field is not static)', () => {
  const f = createWindField(9);
  const v0 = windAt(f, 500, 500, 0);
  const v1 = windAt(f, 500, 500, 10);
  assert.ok(Math.hypot(v1.x - v0.x, v1.y - v0.y) > 0.05, 'field did not change with time');
});
