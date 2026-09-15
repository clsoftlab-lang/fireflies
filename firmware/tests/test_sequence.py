# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Sequence: never release a dead-LED or wrongly-buoyant unit."""
import pytest

from dispenser.sequence import SequenceTimings, State, UnitSequence


def _clock():
    box = {"t": 0.0}
    return box, (lambda: box["t"])


def _run_to(seq, box, until, dt=0.1, max_t=30.0):
    while box["t"] < max_t:
        if seq.tick() == until:
            return True
        box["t"] += dt
    return seq.state == until


def test_happy_path_releases_only_when_trim_and_led_ok():
    box, clk = _clock()
    seq = UnitSequence(clk, SequenceTimings(load_s=0.2, arm_s=0.2, release_s=0.2))
    seq.start()
    seq.report_trim(True)
    seq.report_led_test(True)
    assert _run_to(seq, box, State.READY)
    assert seq.can_release()
    assert seq.command_release() is True
    assert _run_to(seq, box, State.RELEASED)


def test_dead_led_unit_is_faulted_never_released():
    box, clk = _clock()
    seq = UnitSequence(clk, SequenceTimings(load_s=0.2, arm_s=0.2))
    seq.start()
    seq.report_trim(True)
    seq.report_led_test(False)  # dead LED
    assert _run_to(seq, box, State.FAULT)
    assert seq.fault_reason and "LED" in seq.fault_reason
    assert seq.can_release() is False
    assert seq.command_release() is False  # refuses


def test_bad_buoyancy_unit_is_faulted_never_released():
    box, clk = _clock()
    seq = UnitSequence(clk, SequenceTimings(load_s=0.2, arm_s=0.2))
    seq.start()
    seq.report_trim(False)      # not at near-neutral trim
    seq.report_led_test(True)
    assert _run_to(seq, box, State.FAULT)
    assert seq.fault_reason and "trim" in seq.fault_reason
    assert seq.can_release() is False


def test_cannot_release_before_ready():
    box, clk = _clock()
    seq = UnitSequence(clk, SequenceTimings(load_s=0.5, arm_s=0.5))
    seq.start()
    seq.report_trim(True)
    seq.report_led_test(True)
    # still loading/filling/arming
    assert seq.command_release() is False
