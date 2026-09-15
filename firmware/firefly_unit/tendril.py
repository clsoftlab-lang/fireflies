# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Travelling-wave tendril light — spec 00-design-spec.md section 3.1.

The sky-jellyfish (해파리) hangs 3-8 glowing tendrils below the helium bell.
Light runs *down* each tendril, top (near the bell) -> bottom, in a slow wave, so
the unit looks like a jellyfish pulsing and swimming. Many real jellyfish glow in
travelling waves; this reproduces that.

Pure logic: given a time ``t`` it returns a brightness in [0, 1] for every LED on
every tendril. A tiny per-tendril phase offset keeps the strands from pulsing in
lock-step (softer, more organic look). Bounded and continuous.
"""
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class TendrilParams:
    n_tendrils: int = 6          # spec: 3-8 strands
    leds_per_tendril: int = 5    # a few micro-LEDs per strand
    wave_speed_hz: float = 0.35  # wave cycles per second (slow, jellyfish-like)
    width: float = 0.28          # spatial width of the glowing bump (fraction of strand)
    tendril_offset: float = 0.12 # phase stagger between adjacent tendrils

    def __post_init__(self) -> None:
        if self.n_tendrils < 3 or self.n_tendrils > 8:
            raise ValueError("n_tendrils must be 3-8 per spec 3.1")
        if self.leds_per_tendril < 1:
            raise ValueError("leds_per_tendril must be >= 1")
        if self.wave_speed_hz <= 0:
            raise ValueError("wave_speed_hz must be > 0")
        if not (0.0 < self.width <= 1.0):
            raise ValueError("width must be in (0, 1]")


def _circular_distance(a: float, b: float) -> float:
    """Shortest distance between two points on a unit circle (wrap-around)."""
    d = abs(a - b) % 1.0
    return min(d, 1.0 - d)


class TravellingWave:
    """Computes the flowing-light pattern down the tendrils."""

    def __init__(self, params: TendrilParams | None = None):
        self.params = params or TendrilParams()

    def led_position(self, led_index: int) -> float:
        """Normalised position of an LED along a strand: 0.0 = top (bell), 1.0 = bottom."""
        n = self.params.leds_per_tendril
        if n == 1:
            return 0.0
        return led_index / (n - 1)

    def brightness(self, tendril_index: int, led_index: int, t: float) -> float:
        """Brightness in [0, 1] of one LED at time ``t`` seconds.

        The wave front position ``u`` advances 0->1 over time and the LED lights as
        the front sweeps past its position, giving a bump that travels top->bottom.
        """
        p = self.led_position(led_index)
        front = (t * self.params.wave_speed_hz
                 + tendril_index * self.params.tendril_offset) % 1.0
        d = _circular_distance(p, front)
        # Gaussian bump, normalised so the peak is exactly 1.0.
        b = math.exp(-(d / self.params.width) ** 2)
        return max(0.0, min(1.0, b))

    def frame(self, t: float) -> list[list[float]]:
        """Full brightness grid [tendril][led] at time ``t``."""
        return [
            [self.brightness(ti, li, t) for li in range(self.params.leds_per_tendril)]
            for ti in range(self.params.n_tendrils)
        ]
