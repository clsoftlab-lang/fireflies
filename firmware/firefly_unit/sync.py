# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Pulse-coupled oscillator (Mirollo-Strogatz family) — spec 00-design-spec.md section 5.

Pure, host-testable logic. No hardware, no I/O, no wall-clock. Time is passed in.

Model (matches the design spec's plain description and the intended simulator model):
  * Each unit ramps an internal ``phase`` 0 -> 1 over a period ``T`` (~1-2 s).
  * When phase reaches 1 it *flashes* and resets to 0.
  * When it *sees* a neighbour flash (via the phototransistor), it advances its
    own phase by a small excitatory coupling ``eps`` (additive kick, clamped).
  * If a kick pushes phase to >= 1 the unit fires immediately (absorption) and
    resets. Absorption is what makes near-together units merge into one cluster,
    so a random swarm collapses into synchrony with no leader.

Light is the only channel: no radio, no coordinator (spec F3).
"""
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class PCOParams:
    """Parameters for the pulse-coupled oscillator."""

    period_s: float = 1.4        # T, blink period (spec: ~1-2 s)
    coupling_eps: float = 0.10   # phase advance per neighbour flash seen
    refractory_s: float = 0.05   # brief window after firing where kicks are ignored

    def __post_init__(self) -> None:
        if self.period_s <= 0:
            raise ValueError("period_s must be > 0")
        if not (0.0 <= self.coupling_eps < 1.0):
            raise ValueError("coupling_eps must be in [0, 1)")
        if self.refractory_s < 0:
            raise ValueError("refractory_s must be >= 0")


class PulseCoupledOscillator:
    """One firefly's blink phase. Deterministic; drive it with ``advance(dt)``."""

    def __init__(self, params: PCOParams | None = None, phase: float = 0.0):
        self.params = params or PCOParams()
        self.phase = float(phase) % 1.0
        self._time_since_fire = self.params.refractory_s  # start out of refractory

    def advance(self, dt: float) -> bool:
        """Advance internal time by ``dt`` seconds. Returns True if it fired."""
        if dt < 0:
            raise ValueError("dt must be >= 0")
        self._time_since_fire += dt
        self.phase += dt / self.params.period_s
        # tiny tolerance so float accumulation (e.g. ten 0.1 steps) still fires at T
        if self.phase >= 1.0 - 1e-9:
            return self._fire()
        return False

    def receive_flash(self, count: int = 1) -> bool:
        """Register ``count`` neighbour flashes seen this instant. Returns True if
        the kick made this unit fire (absorption)."""
        if count <= 0:
            return False
        if self._time_since_fire < self.params.refractory_s:
            return False  # ignore kicks in the refractory window
        self.phase += self.params.coupling_eps * count
        if self.phase >= 1.0 - 1e-9:
            return self._fire()
        return False

    def _fire(self) -> bool:
        self.phase = 0.0
        self._time_since_fire = 0.0
        return True


def order_parameter(phases: list[float]) -> float:
    """Kuramoto synchrony order parameter R in [0, 1].

    R = |mean(exp(i * 2*pi * phase))|. R -> 1 means fully synchronised,
    R -> 0 means uniformly spread. Used to measure convergence in tests.
    """
    if not phases:
        return 0.0
    re = sum(math.cos(2 * math.pi * p) for p in phases) / len(phases)
    im = sum(math.sin(2 * math.pi * p) for p in phases) / len(phases)
    return math.hypot(re, im)


class Swarm:
    """All-to-all coupled swarm — the reference model used by the simulator and by
    convergence tests. Each unit sees every other unit's flash (idealised full
    visibility). Real units see only neighbours within phototransistor range.
    """

    def __init__(self, phases: list[float], params: PCOParams | None = None):
        self.params = params or PCOParams()
        self.units = [PulseCoupledOscillator(self.params, p) for p in phases]

    @property
    def phases(self) -> list[float]:
        return [u.phase for u in self.units]

    def order_parameter(self) -> float:
        return order_parameter(self.phases)

    def step(self, dt: float) -> list[int]:
        """Advance the whole swarm by ``dt``. Returns indices that flashed.

        Single-pass, deterministic: first everyone advances (natural fires), then
        each non-firing unit is kicked once by the number of units that fired.
        """
        fired = [i for i, u in enumerate(self.units) if u.advance(dt)]
        n_fired = len(fired)
        if n_fired:
            fired_set = set(fired)
            for i, u in enumerate(self.units):
                if i in fired_set:
                    continue
                # a unit that fires from the kick (absorption) joins this flash
                if u.receive_flash(n_fired):
                    fired.append(i)
        return fired
