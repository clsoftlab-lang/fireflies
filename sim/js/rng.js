// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CLSOFTLAB (씨엘소프트랩), Dr. Lee Il-guk (이일국)
//
// rng.js — seeded, deterministic pseudo-random number generator (mulberry32).
// Pure, dependency-free ES module; identical output in the browser and in
// `node --test`. Same seed → same stream, always.

/**
 * mulberry32 — a small, fast, decent-quality 32-bit PRNG.
 * @param {number} seed  any integer; coerced to uint32.
 * @returns {() => number} a function returning floats in [0, 1).
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically fold a string into a uint32 seed (FNV-1a style).
 * @param {string} str
 * @returns {number}
 */
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Uniform float in [lo, hi). */
export function randRange(rng, lo, hi) {
  return lo + (hi - lo) * rng();
}

/** Integer in [lo, hi] inclusive. */
export function randInt(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}
