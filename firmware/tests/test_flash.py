# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Flash: capacitor-boost profile peaks sharply then decays; mixer colours."""
import pytest

from firefly_unit.flash import FlashParams, FlashProfile, capacitor_charge
from firefly_unit.led_mixer import LedMixer, MixerParams


def test_capacitor_charges_monotonically_toward_vmax():
    prev = -1.0
    for t in [0.0, 0.1, 0.2, 0.5, 1.0, 2.0]:
        v = capacitor_charge(t, rc=0.3, vmax=1.0)
        assert v >= prev
        prev = v
    assert capacitor_charge(0.0) == 0.0
    assert capacitor_charge(5.0, rc=0.3) > 0.99


def test_flash_dark_before_trigger():
    fp = FlashProfile()
    assert fp.brightness(-0.01) == 0.0


def test_flash_peaks_then_decays():
    fp = FlashProfile(FlashParams(peak=1.0, rise_s=0.008, decay_s=0.10))
    # peak occurs at the rise time and equals the peak value
    assert fp.peak_time == pytest.approx(0.008)
    assert fp.brightness(0.008) == pytest.approx(1.0, abs=1e-9)
    # sharp rise: dark -> peak quickly
    assert fp.brightness(0.004) == pytest.approx(0.5, abs=1e-9)
    # monotonic decay after the peak
    later = [fp.brightness(0.008 + d) for d in [0.01, 0.05, 0.1, 0.3]]
    assert all(later[i] > later[i + 1] for i in range(len(later) - 1))
    # decays well below peak after a few time constants
    assert fp.brightness(0.008 + 5 * 0.10) < 0.01


def test_flash_envelope_max_is_peak():
    fp = FlashProfile(FlashParams(peak=0.9))
    env = fp.samples(duration_s=0.6, dt=0.002)
    assert max(env) == pytest.approx(0.9, abs=1e-6)
    assert min(env) >= 0.0


def test_mixer_rest_is_amber_flash_is_bluer():
    mx = LedMixer(MixerParams(base_amber=0.18, spark_tint=0.55))
    r0, g0, b0 = mx.mix(base_level=0.0, flash_level=0.0)
    assert r0 > g0 > b0            # amber: red-dominant, little blue
    assert b0 < 0.02              # amber carries only a trace of blue
    r1, g1, b1 = mx.mix(base_level=0.0, flash_level=1.0)
    assert b1 > b0                 # flash injects cool white/blue
    assert (r1 + g1 + b1) > (r0 + g0 + b0)  # and is brighter overall


def test_mixer_clamps_to_unit_range():
    mx = LedMixer(MixerParams(base_amber=1.0, flash_gain=5.0))
    for ch in mx.mix(base_level=1.0, flash_level=1.0):
        assert 0.0 <= ch <= 1.0
