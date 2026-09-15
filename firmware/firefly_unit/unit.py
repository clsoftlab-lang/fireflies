# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Firefly / sky-jellyfish unit behaviour — ties the pure models together.

Everything here is host-testable: the wall clock and the hardware are *injected*.
On a real ATtiny/Pico the ``UnitHAL`` methods drive the phototransistor ADC, the
LED PWM channels and the capacitor-flash gate; in tests they are fakes.

Loop each tick:
  1. read the phototransistor (see neighbours' flashes) -> kick the sync oscillator
  2. advance the pulse-coupled oscillator; if it fires, trigger a capacitor flash
  3. compute the travelling-wave tendril brightness (the flowing glow)
  4. mix amber base + flash into an RGB and write it to the bell/tendril LEDs
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Protocol

from .flash import FlashParams, FlashProfile
from .led_mixer import RGB, LedMixer, MixerParams
from .sync import PCOParams, PulseCoupledOscillator
from .tendril import TendrilParams, TravellingWave


class UnitHAL(Protocol):
    """Hardware abstraction the unit drives. Implemented by real firmware or a fake."""

    def read_photosensor(self) -> float:
        """Ambient/neighbour light, normalised ~[0, 1]. Bright => a neighbour flashed."""
        ...

    def set_bell_led(self, rgb: RGB) -> None:
        """Drive the bell LED (amber base + spark flash)."""
        ...

    def set_tendril_leds(self, frame: list[list[float]]) -> None:
        """Drive the tendril LED grid [tendril][led] with brightness in [0, 1]."""
        ...


@dataclass
class UnitConfig:
    sync: PCOParams = field(default_factory=PCOParams)
    tendril: TendrilParams = field(default_factory=TendrilParams)
    flash: FlashParams = field(default_factory=FlashParams)
    mixer: MixerParams = field(default_factory=MixerParams)
    flash_trigger_level: float = 0.5   # photosensor level counted as a neighbour flash


class FireflyUnit:
    """One sky-jellyfish. Drive it with ``step(now)`` where ``now`` is seconds."""

    def __init__(
        self,
        hal: UnitHAL,
        clock: Callable[[], float],
        config: UnitConfig | None = None,
        initial_phase: float = 0.0,
    ):
        self.hal = hal
        self.clock = clock
        self.cfg = config or UnitConfig()
        self.osc = PulseCoupledOscillator(self.cfg.sync, initial_phase)
        self.wave = TravellingWave(self.cfg.tendril)
        self.flash = FlashProfile(self.cfg.flash)
        self.mixer = LedMixer(self.cfg.mixer)
        self._last_t: float | None = None
        self._flash_started_at: float | None = None  # None => not flashing

    def flash_level(self, now: float) -> float:
        """Current capacitor-flash envelope value at time ``now``."""
        if self._flash_started_at is None:
            return 0.0
        return self.flash.brightness(now - self._flash_started_at)

    def trigger_flash(self, now: float) -> None:
        self._flash_started_at = now

    def step(self, now: float | None = None) -> RGB:
        """Advance the unit to time ``now`` (defaults to the injected clock).

        Returns the bell RGB it wrote (handy for tests)."""
        if now is None:
            now = self.clock()
        if self._last_t is None:
            self._last_t = now
        dt = max(0.0, now - self._last_t)
        self._last_t = now

        # 1. see neighbours -> kick sync
        light = self.hal.read_photosensor()
        if light >= self.cfg.flash_trigger_level:
            self.osc.receive_flash(1)

        # 2. advance own oscillator -> maybe fire
        if self.osc.advance(dt):
            self.trigger_flash(now)

        # let a finished flash go dark again (envelope ~ decayed)
        fl = self.flash_level(now)
        if self._flash_started_at is not None and (now - self._flash_started_at) > (
            self.flash.params.rise_s + 8.0 * self.flash.params.decay_s
        ):
            self._flash_started_at = None
            fl = 0.0

        # 3. tendril travelling wave (base glow that flows down the strands)
        frame = self.wave.frame(now)
        self.hal.set_tendril_leds(frame)

        # 4. mix amber base + flash for the bell. Base level tracks the top-of-tendril
        #    glow so the bell breathes with the wave.
        base_level = frame[0][0] if frame and frame[0] else 0.0
        rgb = self.mixer.mix(base_level, fl)
        self.hal.set_bell_led(rgb)
        return rgb
