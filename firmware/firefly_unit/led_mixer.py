# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""LED colour mixer — spec 00-design-spec.md sections 3, 5.1.

Warm amber (~590 nm) is the firefly base glow. The capacitor flash mixes a touch
of cool white / blue into the amber to mimic the colour of an electric spark. This
module turns (amber base level, flash level) into a normalised RGB the firmware
writes to the LED channels.

Pure logic; RGB channels are clamped to [0, 1].
"""
from __future__ import annotations

from dataclasses import dataclass

RGB = tuple[float, float, float]

# Warm amber ~590 nm, approximate linear-RGB. R full, G partial, ~no blue.
AMBER: RGB = (1.0, 0.62, 0.05)
# Cool white with a blue lean, the "electric spark" tint added at flash peak.
COOL_WHITE: RGB = (0.80, 0.90, 1.0)


@dataclass(frozen=True)
class MixerParams:
    base_amber: float = 0.18   # steady dim amber glow between flashes
    flash_gain: float = 1.0    # how strongly the flash drives the LEDs
    spark_tint: float = 0.55   # 0 = flash stays amber, 1 = flash is fully cool-white

    def __post_init__(self) -> None:
        if not (0.0 <= self.base_amber <= 1.0):
            raise ValueError("base_amber must be in [0, 1]")
        if self.flash_gain < 0:
            raise ValueError("flash_gain must be >= 0")
        if not (0.0 <= self.spark_tint <= 1.0):
            raise ValueError("spark_tint must be in [0, 1]")


def _clamp01(x: float) -> float:
    return 0.0 if x < 0.0 else 1.0 if x > 1.0 else x


class LedMixer:
    """Combines the steady amber base with the spark-like flash."""

    def __init__(self, params: MixerParams | None = None):
        self.params = params or MixerParams()

    def mix(self, base_level: float, flash_level: float) -> RGB:
        """Return the LED colour for a base amber level and a flash level.

        ``base_level`` scales the amber glow (e.g. the tendril wave brightness).
        ``flash_level`` in [0, 1] is the capacitor flash envelope.
        """
        p = self.params
        base_level = _clamp01(base_level)
        flash_level = _clamp01(flash_level)

        amber_amt = p.base_amber + base_level * (1.0 - p.base_amber)
        base_rgb = tuple(c * amber_amt for c in AMBER)

        # Flash contribution: interpolate amber -> cool white by spark_tint,
        # scaled by the flash envelope and gain.
        f = flash_level * p.flash_gain
        flash_color = tuple(
            AMBER[i] * (1.0 - p.spark_tint) + COOL_WHITE[i] * p.spark_tint
            for i in range(3)
        )
        flash_rgb = tuple(c * f for c in flash_color)

        return (
            _clamp01(base_rgb[0] + flash_rgb[0]),
            _clamp01(base_rgb[1] + flash_rgb[1]),
            _clamp01(base_rgb[2] + flash_rgb[2]),
        )
