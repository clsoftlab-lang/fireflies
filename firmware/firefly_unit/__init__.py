# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Firefly / sky-jellyfish unit firmware — pure, host-testable logic.

Modules:
  sync       pulse-coupled oscillator (synchronised blinking, spec 5)
  tendril    travelling-wave light down the jellyfish tendrils (spec 3.1)
  flash      capacitor-boosted spark-like flash profile (spec 5.1)
  led_mixer  amber base + cool-white flash colour mix (spec 3, 5.1)
  unit       ties them together with an injected clock + hardware abstraction
"""
from .flash import FlashParams, FlashProfile, capacitor_charge
from .led_mixer import AMBER, COOL_WHITE, LedMixer, MixerParams
from .sync import PCOParams, PulseCoupledOscillator, Swarm, order_parameter
from .tendril import TendrilParams, TravellingWave
from .unit import FireflyUnit, UnitConfig, UnitHAL

__all__ = [
    "PCOParams", "PulseCoupledOscillator", "Swarm", "order_parameter",
    "TendrilParams", "TravellingWave",
    "FlashParams", "FlashProfile", "capacitor_charge",
    "AMBER", "COOL_WHITE", "LedMixer", "MixerParams",
    "FireflyUnit", "UnitConfig", "UnitHAL",
]
