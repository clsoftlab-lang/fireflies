# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Controller: releases one at a time on a cadence; all-stop halts; rejects bad units."""
from dispenser.controller import CadenceParams, Dispenser
from dispenser.sequence import SequenceTimings


def _driver(magazine, evaluate, cadence_gap=0.5, timings=None):
    box = {"t": 0.0}
    d = Dispenser(
        clock=lambda: box["t"],
        magazine_count=magazine,
        cadence=CadenceParams(release_gap_s=cadence_gap),
        timings=timings or SequenceTimings(load_s=0.1, arm_s=0.1, release_s=0.1),
    )
    d.evaluate_unit = evaluate
    return d, box


def test_releases_all_good_units_one_at_a_time():
    d, box = _driver(3, evaluate=lambda: (True, True), cadence_gap=0.5)
    d.start()
    for _ in range(2000):
        d.tick()
        box["t"] += 0.05
        if d.remaining == 0 and d._seq is None:
            break
    assert d.released_count == 3
    assert d.rejected_count == 0


def test_all_stop_halts_releasing():
    d, box = _driver(5, evaluate=lambda: (True, True), cadence_gap=0.5)
    d.start()
    # run a little, then all-stop
    for _ in range(40):
        d.tick()
        box["t"] += 0.05
    released_at_stop = d.released_count
    d.all_stop()
    # keep ticking: nothing more should be released while stopped
    for _ in range(400):
        d.tick()
        box["t"] += 0.05
    assert d.released_count == released_at_stop
    assert d.running is False


def test_all_stop_then_resume():
    d, box = _driver(3, evaluate=lambda: (True, True), cadence_gap=0.3)
    d.start()
    for _ in range(20):
        d.tick(); box["t"] += 0.05
    d.all_stop()
    for _ in range(20):
        d.tick(); box["t"] += 0.05
    d.start()  # resume
    for _ in range(3000):
        d.tick(); box["t"] += 0.05
        if d.remaining == 0 and d._seq is None:
            break
    assert d.released_count == 3


def test_bad_units_are_rejected_not_released():
    # every unit has a dead LED -> all rejected, none released
    d, box = _driver(4, evaluate=lambda: (True, False), cadence_gap=0.2)
    d.start()
    for _ in range(3000):
        d.tick(); box["t"] += 0.05
        if d.remaining == 0 and d._seq is None:
            break
    assert d.released_count == 0
    assert d.rejected_count == 4


def test_mix_of_good_and_bad_units():
    # per-unit results, keyed off the dispenser's own units_started counter
    # (unit 1 has bad trim, unit 3 has a dead LED)
    pool = [(True, True), (False, True), (True, True), (True, False), (True, True)]
    box = {"t": 0.0}
    d = Dispenser(clock=lambda: box["t"], magazine_count=5,
                  cadence=CadenceParams(release_gap_s=0.2),
                  timings=SequenceTimings(load_s=0.1, arm_s=0.1, release_s=0.1))
    d.evaluate_unit = lambda: pool[min(d.units_started - 1, len(pool) - 1)]
    d.start()
    for _ in range(6000):
        d.tick(); box["t"] += 0.05
        if d.remaining == 0 and d._seq is None:
            break
    assert d.released_count == 3   # units 0,2,4 good
    assert d.rejected_count == 2   # units 1 (bad trim), 3 (dead LED)
