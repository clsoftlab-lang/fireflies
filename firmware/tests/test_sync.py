# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Sync: pulse-coupled oscillators converge to synchrony from random starts."""
import random

import pytest

from firefly_unit.sync import (PCOParams, PulseCoupledOscillator, Swarm,
                               order_parameter)


def test_oscillator_fires_after_one_period():
    osc = PulseCoupledOscillator(PCOParams(period_s=1.0, coupling_eps=0.1))
    fired = [osc.advance(0.1) for _ in range(10)]
    assert fired[-1] is True
    assert sum(fired) == 1
    assert osc.phase == pytest.approx(0.0, abs=1e-9)


def test_flash_kick_advances_phase_and_can_absorb():
    osc = PulseCoupledOscillator(PCOParams(period_s=1.0, coupling_eps=0.2), phase=0.5)
    osc.advance(0.0)  # clear refractory
    osc.receive_flash(1)
    assert osc.phase == pytest.approx(0.7, abs=1e-9)
    # a big enough kick makes it fire (absorption) and reset
    fired = osc.receive_flash(2)  # 0.7 + 0.4 -> >=1
    assert fired is True
    assert osc.phase == pytest.approx(0.0, abs=1e-9)


def test_refractory_ignores_immediate_kick():
    osc = PulseCoupledOscillator(PCOParams(period_s=1.0, refractory_s=0.05))
    # drive to a natural fire
    while not osc.advance(0.01):
        pass
    p = osc.phase
    assert osc.receive_flash(1) is False  # within refractory, ignored
    assert osc.phase == p


def test_order_parameter_bounds():
    assert order_parameter([]) == 0.0
    assert order_parameter([0.3, 0.3, 0.3]) == pytest.approx(1.0)
    spread = order_parameter([0.0, 0.25, 0.5, 0.75])
    assert spread == pytest.approx(0.0, abs=1e-9)


@pytest.mark.parametrize("seed", [1, 2, 3, 7, 42])
def test_swarm_converges_to_synchrony(seed):
    rng = random.Random(seed)
    phases = [rng.random() for _ in range(40)]
    sw = Swarm(phases, PCOParams(period_s=1.4, coupling_eps=0.10))
    assert sw.order_parameter() < 0.5  # starts unsynchronised
    dt = 0.01
    for _ in range(int(60 / dt)):  # 60 s of light-only coupling
        sw.step(dt)
    assert sw.order_parameter() > 0.95  # ends synchronised, no leader
