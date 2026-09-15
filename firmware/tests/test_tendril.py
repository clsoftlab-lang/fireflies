# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Tendril: travelling-wave light stays bounded and moves top->bottom."""
import pytest

from firefly_unit.tendril import TendrilParams, TravellingWave


def test_frame_shape_and_bounds():
    wave = TravellingWave(TendrilParams(n_tendrils=6, leds_per_tendril=5))
    for t in [0.0, 0.3, 1.1, 2.7, 5.0]:
        frame = wave.frame(t)
        assert len(frame) == 6
        assert all(len(strand) == 5 for strand in frame)
        for strand in frame:
            for b in strand:
                assert 0.0 <= b <= 1.0


def test_led_positions_span_top_to_bottom():
    wave = TravellingWave(TendrilParams(leds_per_tendril=5))
    assert wave.led_position(0) == pytest.approx(0.0)   # top, near the bell
    assert wave.led_position(4) == pytest.approx(1.0)   # bottom of the strand


def test_wave_travels_downward():
    # single tendril, no stagger, so the peak position is unambiguous
    wave = TravellingWave(TendrilParams(
        n_tendrils=3, leds_per_tendril=9, wave_speed_hz=0.2, tendril_offset=0.0))
    dt = 0.25
    peaks = []
    for k in range(4):  # quarter of a cycle, before wrap
        strand = wave.frame(k * dt)[0]
        peaks.append(max(range(len(strand)), key=lambda i: strand[i]))
    # argmax LED index increases: the glowing bump moves top(0)->bottom
    assert peaks == sorted(peaks)
    assert peaks[-1] > peaks[0]


def test_invalid_params_rejected():
    with pytest.raises(ValueError):
        TendrilParams(n_tendrils=2)   # spec: 3-8
    with pytest.raises(ValueError):
        TendrilParams(n_tendrils=9)
