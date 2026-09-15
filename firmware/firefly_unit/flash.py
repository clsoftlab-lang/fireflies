# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Capacitor-boosted spark-like flash profile — spec 00-design-spec.md section 5.1.

We NEVER put a real spark or any ignition source on a flying unit (fire risk on a
free-drifting object). Instead a small capacitor charges quietly, then dumps into
the LED for a brief, intense burst: dark between flashes, snaps bright at the peak,
then decays fast. This gives the crisp spark-like "pop" with no flame.

Pure logic:
  * ``capacitor_charge(t)``  : quiet charge curve V(t) = Vmax*(1 - exp(-t/RC)).
  * ``FlashProfile.brightness(t)`` : the flash itself — a very fast rise to a sharp
    peak followed by an exponential decay (the capacitor emptying into the LED).

All brightnesses are normalised to [0, 1].
"""
from __future__ import annotations

import math
from dataclasses import dataclass


def capacitor_charge(t: float, rc: float = 0.30, vmax: float = 1.0) -> float:
    """Capacitor voltage while charging quietly between flashes.

    V(t) = Vmax * (1 - exp(-t / RC)). Stored energy ~ V^2 sets flash brightness.
    """
    if rc <= 0:
        raise ValueError("rc must be > 0")
    if t <= 0:
        return 0.0
    return vmax * (1.0 - math.exp(-t / rc))


@dataclass(frozen=True)
class FlashParams:
    peak: float = 1.0        # peak brightness (normalised)
    rise_s: float = 0.008    # time to snap from dark to peak (very fast)
    decay_s: float = 0.10    # exponential decay time constant after the peak

    def __post_init__(self) -> None:
        if not (0.0 < self.peak <= 1.0):
            raise ValueError("peak must be in (0, 1]")
        if self.rise_s <= 0 or self.decay_s <= 0:
            raise ValueError("rise_s and decay_s must be > 0")


class FlashProfile:
    """The spark-like flash: fast linear rise to peak, then exponential decay."""

    def __init__(self, params: FlashParams | None = None):
        self.params = params or FlashParams()

    @property
    def peak_time(self) -> float:
        """Time of peak brightness after the trigger (== rise time)."""
        return self.params.rise_s

    def brightness(self, t: float) -> float:
        """Flash brightness in [0, 1] at ``t`` seconds after the trigger.

        t < 0            -> 0 (dark, capacitor still charging elsewhere)
        0 <= t < rise    -> linear snap up to peak
        t >= rise        -> peak * exp(-(t - rise) / decay)
        """
        p = self.params
        if t < 0:
            return 0.0
        if t < p.rise_s:
            return p.peak * (t / p.rise_s)
        return p.peak * math.exp(-(t - p.rise_s) / p.decay_s)

    def samples(self, duration_s: float, dt: float) -> list[float]:
        """Sampled flash envelope over ``duration_s`` at step ``dt``."""
        if dt <= 0:
            raise ValueError("dt must be > 0")
        n = int(round(duration_s / dt))
        return [self.brightness(i * dt) for i in range(n + 1)]
