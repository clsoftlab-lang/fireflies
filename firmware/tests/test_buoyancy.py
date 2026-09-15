# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Buoyancy: the fill loop reaches near-neutral trim, stops, and never overshoots."""
import pytest

from dispenser.buoyancy import (BuoyancyController, TrimParams,
                                helium_litres_for_lift, LIFT_G_PER_LITRE)


class SimBalloon:
    """A simple plant: opening the valve adds helium => lift rises. Cannot go down.

    lift += fill_rate * valve_fraction * dt each step. Records max lift for the
    overshoot check.
    """

    def __init__(self, fill_rate=0.5, dt=0.05, start_lift=0.0):
        self.lift = start_lift
        self.valve = 0.0
        self.fill_rate = fill_rate
        self.dt = dt
        self.max_lift = start_lift

    def read_lift_grams(self):
        # apply the previously-set valve for one step, then report
        self.lift += self.fill_rate * self.valve * self.dt
        self.max_lift = max(self.max_lift, self.lift)
        return self.lift

    def set_open_fraction(self, frac):
        self.valve = frac


def test_reaches_trim_and_closes_valve():
    plant = SimBalloon(fill_rate=0.4, dt=0.05)
    params = TrimParams(target_lift_g=0.20, tolerance_g=0.03)
    ctl = BuoyancyController(plant, plant, params)
    assert ctl.run(max_steps=5000) is True
    assert ctl.done is True
    assert ctl.at_trim(ctl.last_lift)
    assert plant.valve == 0.0  # valve shut after trim


def test_never_overshoots_tolerance_band():
    plant = SimBalloon(fill_rate=0.3, dt=0.05)
    params = TrimParams(target_lift_g=0.25, tolerance_g=0.03, slow_zone_g=0.15)
    ctl = BuoyancyController(plant, plant, params)
    ctl.run(max_steps=8000)
    # helium can't be removed, so the peak lift must stay within the upper band edge
    assert plant.max_lift <= params.target_lift_g + params.tolerance_g + 1e-6


def test_stays_stopped_after_trim():
    plant = SimBalloon(fill_rate=0.5, dt=0.05)
    ctl = BuoyancyController(plant, plant, TrimParams())
    ctl.run()
    lift_at_done = ctl.last_lift
    for _ in range(50):
        ctl.step()
    assert plant.valve == 0.0
    assert ctl.last_lift == pytest.approx(lift_at_done, abs=1e-9)  # no more fill


def test_physics_helper_matches_spec_numbers():
    # ~1.06 g lift per litre of helium at sea level (spec 4 / hardware README)
    assert LIFT_G_PER_LITRE == pytest.approx(1.06, abs=0.01)
    # a 4.4 g-lift payload needs ~4.15 L of helium
    litres = helium_litres_for_lift(free_lift_g=0.0, payload_g=4.4)
    assert litres == pytest.approx(4.4 / 1.06, rel=1e-6)
