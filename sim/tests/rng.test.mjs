// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CLSOFTLAB (씨엘소프트랩), Dr. Lee Il-guk (이일국)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, hashSeed, randRange, randInt } from '../js/rng.js';

test('mulberry32 is deterministic: same seed → identical stream', () => {
  const a = mulberry32(12345);
  const b = mulberry32(12345);
  for (let i = 0; i < 1000; i++) assert.equal(a(), b());
});

test('mulberry32 differs across seeds', () => {
  const a = mulberry32(1);
  const b = mulberry32(2);
  let same = 0;
  for (let i = 0; i < 100; i++) if (a() === b()) same++;
  assert.ok(same < 3, `streams should diverge, got ${same} coincidences`);
});

test('mulberry32 output stays in [0,1)', () => {
  const r = mulberry32(999);
  for (let i = 0; i < 5000; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
  }
});

test('mulberry32 is roughly uniform (mean near 0.5)', () => {
  const r = mulberry32(7);
  let s = 0;
  const N = 20000;
  for (let i = 0; i < N; i++) s += r();
  const mean = s / N;
  assert.ok(Math.abs(mean - 0.5) < 0.02, `mean ${mean}`);
});

test('hashSeed is deterministic and seeds the PRNG reproducibly', () => {
  assert.equal(hashSeed('fireflies'), hashSeed('fireflies'));
  assert.notEqual(hashSeed('a'), hashSeed('b'));
  const s = hashSeed('해파리');
  assert.equal(mulberry32(s)(), mulberry32(s)());
});

test('randRange / randInt respect bounds', () => {
  const r = mulberry32(42);
  for (let i = 0; i < 1000; i++) {
    const f = randRange(r, -5, 5);
    assert.ok(f >= -5 && f < 5);
    const n = randInt(r, 3, 8);
    assert.ok(n >= 3 && n <= 8 && Number.isInteger(n));
  }
});
