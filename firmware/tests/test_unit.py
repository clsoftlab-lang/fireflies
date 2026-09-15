# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Unit: ties sync + tendril + flash + mixer with an injected clock and fake HAL."""
from firefly_unit.unit import FireflyUnit, UnitConfig
from firefly_unit.sync import PCOParams


class FakeHAL:
    def __init__(self, light=0.0):
        self.light = light
        self.bell = None
        self.tendrils = None

    def read_photosensor(self):
        return self.light

    def set_bell_led(self, rgb):
        self.bell = rgb

    def set_tendril_leds(self, frame):
        self.tendrils = frame


def test_unit_drives_leds_and_flashes_on_fire():
    hal = FakeHAL()
    now = {"t": 0.0}
    cfg = UnitConfig(sync=PCOParams(period_s=1.0))
    unit = FireflyUnit(hal, clock=lambda: now["t"], config=cfg)

    flashed = False
    dt = 0.02
    for _ in range(120):  # >2 periods
        now["t"] += dt
        unit.step()
        assert hal.bell is not None and hal.tendrils is not None
        for ch in hal.bell:
            assert 0.0 <= ch <= 1.0
        if unit.flash_level(now["t"]) > 0.2:
            flashed = True
    assert flashed  # the oscillator fired and drove a capacitor flash


def test_unit_kicked_by_neighbour_light():
    # A bright neighbour advances the sync phase (light-only coupling).
    hal_quiet = FakeHAL(light=0.0)
    hal_lit = FakeHAL(light=1.0)
    t = {"v": 0.0}
    cfg = UnitConfig(sync=PCOParams(period_s=2.0, coupling_eps=0.2))
    a = FireflyUnit(hal_quiet, clock=lambda: t["v"], config=cfg, initial_phase=0.3)
    b = FireflyUnit(hal_lit, clock=lambda: t["v"], config=cfg, initial_phase=0.3)
    t["v"] += 0.1
    a.step()
    b.step()
    assert b.osc.phase > a.osc.phase  # b saw a flash and jumped ahead
