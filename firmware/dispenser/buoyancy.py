# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Buoyancy trim control — spec 00-design-spec.md sections 4, F2.

The make-or-break step: fill a balloon with helium until it is at *near-neutral
buoyancy* so it hovers and drifts rather than shooting up. A load cell (via an
HX711 amp) measures the balloon's net upward pull (free lift, in grams-force). A
servo/solenoid valve meters helium onto the line.

Key physical asymmetry: we can add helium but not easily remove it, so the loop
must approach the target *from below* and never overshoot the tolerance band. A
proportional valve, slowing near target, does this.

Pure logic: the load cell and valve are injected interfaces, so the loop is fully
host-testable against a simulated balloon.

Physics of lift (sea level, ~15 C):
  lift per litre of helium ~= (rho_air - rho_He) ~= (1.225 - 0.166) ~= 1.06 g/L.
So a payload of X grams needs ~= X / 1.06 litres of helium. See hardware/README.md.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Protocol

# grams-force of free lift per litre of helium at sea level (~15 C)
LIFT_G_PER_LITRE = 1.06


def helium_litres_for_lift(free_lift_g: float, payload_g: float) -> float:
    """Helium volume (litres) needed so the balloon lifts ``payload_g`` and still has
    ``free_lift_g`` of spare (near-neutral) lift."""
    return (free_lift_g + payload_g) / LIFT_G_PER_LITRE


class LoadCell(Protocol):
    def read_lift_grams(self) -> float:
        """Net upward pull of the tethered balloon, grams-force. Injected."""
        ...


class HeliumValve(Protocol):
    def set_open_fraction(self, frac: float) -> None:
        """Open the helium valve 0.0 (shut) .. 1.0 (full). Injected."""
        ...


@dataclass(frozen=True)
class TrimParams:
    target_lift_g: float = 0.20    # near-neutral: a hair of positive lift so it drifts
    tolerance_g: float = 0.03      # acceptable band around target
    kp: float = 1.2                # proportional gain (valve per gram of error)
    max_open: float = 1.0          # cap valve opening
    slow_zone_g: float = 0.15      # within this error, ease off to avoid overshoot

    def __post_init__(self) -> None:
        if self.target_lift_g <= 0:
            raise ValueError("target_lift_g must be > 0 (near-neutral, slightly positive)")
        if self.tolerance_g <= 0:
            raise ValueError("tolerance_g must be > 0")


class BuoyancyController:
    """Proportional fill loop that reaches near-neutral trim and closes the valve."""

    def __init__(self, load_cell: LoadCell, valve: HeliumValve,
                 params: TrimParams | None = None):
        self.load_cell = load_cell
        self.valve = valve
        self.p = params or TrimParams()
        self.done = False
        self.last_lift = 0.0
        self.last_valve = 0.0

    def at_trim(self, lift: float) -> bool:
        return abs(lift - self.p.target_lift_g) <= self.p.tolerance_g

    def step(self) -> float:
        """One control step. Reads lift, sets valve, returns the valve fraction.

        Approaches from below: only opens the valve while under target. Once within
        tolerance (or at/over target) it shuts the valve and latches ``done``.
        """
        lift = self.load_cell.read_lift_grams()
        self.last_lift = lift

        if self.done:
            self.valve.set_open_fraction(0.0)
            self.last_valve = 0.0
            return 0.0

        error = self.p.target_lift_g - lift  # positive => need more helium
        if error <= self.p.tolerance_g:
            # within band (or overshot): stop for good, never vent
            self.done = True
            self.valve.set_open_fraction(0.0)
            self.last_valve = 0.0
            return 0.0

        # proportional, eased down inside the slow zone so we don't blow past target
        opening = self.p.kp * error
        if error < self.p.slow_zone_g:
            opening *= error / self.p.slow_zone_g
        opening = max(0.0, min(self.p.max_open, opening))
        self.valve.set_open_fraction(opening)
        self.last_valve = opening
        return opening

    def run(self, max_steps: int = 10_000) -> bool:
        """Run the loop until trimmed or ``max_steps``. Returns True if trimmed."""
        for _ in range(max_steps):
            self.step()
            if self.done:
                return self.at_trim(self.last_lift)
        return False
