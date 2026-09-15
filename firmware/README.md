<!--
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
-->
# Fireflies firmware

Pure, host-testable logic for the two devices in the [design spec](../docs/en/00-design-spec.md):

- **`firefly_unit/`** — the flying sky-jellyfish (해파리) behaviour.
- **`dispenser/`** — the desktop machine that fills, trims, tests and releases units.

Everything here is **plain Python with no hardware dependency**. The wall clock and
all hardware (photosensor, LEDs, load cell, helium valve) are *injected* interfaces,
so the exact same logic runs under `pytest` on a laptop and, ported, on an
ATtiny/Pico. Nothing in this folder needs to be cross-compiled to be tested.

## Layout

```
firefly_unit/
  sync.py       pulse-coupled oscillator — synchronised blinking, no leader (spec §5)
  tendril.py    travelling-wave light down the jellyfish tendrils (spec §3.1)
  flash.py      capacitor-boosted spark-like flash profile (spec §5.1)
  led_mixer.py  amber base + cool-white spark tint (spec §3, §5.1)
  unit.py       ties them together via an injected clock + UnitHAL
  embedded/     pin-mapping notes for real ATtiny / Pico targets (MicroPython + C)
dispenser/
  buoyancy.py   fill-to-near-neutral-trim control loop (spec §4, F2)
  sequence.py   per-unit state machine: load → fill → arm+LED test → release (spec §4)
  controller.py start / all-stop, releases one at a time on a gentle cadence (spec §4)
tests/          pytest — all green
```

## Run the tests

```powershell
cd firmware
python -m pytest tests -q
```

34 tests cover: sync convergence to synchrony, tendril wave bounds + downward
travel, flash peak/decay profile, colour mixing, buoyancy loop reaching trim and
stopping without overshoot, the sequence never releasing a dead-LED or
wrongly-buoyant unit, and all-stop halting releases.

## Design notes

- **No spark, ever, on a flying unit.** The "spark-like" look is a *capacitor-boosted
  LED flash* (`flash.py`), never an ignition source — see spec §5.1. A free-drifting
  object can land anywhere; a real spark is a fire risk.
- **Light is the only sync channel** (`sync.py`): no radio, no coordinator. Units
  nudge their blink toward the neighbours their phototransistor can see.
- **Safety guards live in the dispenser, not the sky:** `sequence.py` refuses to
  release any unit that failed its LED self-test or is not at near-neutral trim.

## Porting to hardware

The pure logic is target-agnostic. See [`firefly_unit/embedded/README.md`](firefly_unit/embedded/README.md)
for the ATtiny/Pico pin maps and how the injected interfaces (`UnitHAL`, `LoadCell`,
`HeliumValve`) map to real ADC/PWM/servo/HX711 calls. Embedded builds are **not**
verified here — only the pure logic is.

Licence: Apache-2.0.
