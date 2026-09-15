<!--
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
-->
# Embedded targets — pin mapping (unit + dispenser)

The Python in `firefly_unit/` and `dispenser/` is the **reference behaviour**. On real
hardware you re-implement the small `UnitHAL` / `LoadCell` / `HeliumValve` interfaces
against the chip's peripherals; the maths (sync, tendril wave, flash envelope,
buoyancy loop, sequence) is copied over unchanged. **Not compiled or flashed here** —
this is a wiring/porting note only.

## A. Flying unit — ATtiny85 or ATtiny1616 (analog blinker is a no-MCU alternative)

The unit is mass-budget-critical (every milligram, see `hardware/README.md`), so the
MCU is the smallest that does the job.

| Pure interface (`unit.UnitHAL`) | Signal | ATtiny1616 pin | Notes |
|---|---|---|---|
| `read_photosensor()` | phototransistor → ADC | PA4 (ADC0/AIN4) | sees neighbour flashes; feeds `sync.py` |
| `set_bell_led(rgb)` amber ch | amber LED PWM | PB0 (TCA0 WO0) | warm ~590 nm base glow |
| `set_bell_led(rgb)` white ch | cool-white LED PWM | PB1 (TCA0 WO1) | spark tint at flash peak |
| flash cap gate | MOSFET gate → cap→LED | PA5 (digital out) | dumps the boost capacitor (§5.1) |
| `set_tendril_leds(frame)` | tendril LED string | PA1 (SPI/1-wire) | e.g. tiny addressable string, or PWM banks |

Timekeeping: the injected `clock()` becomes the RTC / `millis()` equivalent
(TCB in periodic mode). Call `FireflyUnit.step(now)` each tick (~50–100 Hz is ample).

**Analog-only variant (no firmware):** replace the MCU with a relaxation oscillator
(e.g. a small timer IC or transistor astable) driving the amber LED, plus the
capacitor-boost stage for the flash. It just blinks — no light-based synchrony. This
is the cheapest, lightest build; `sync.py` only matters if you fit the MCU +
phototransistor.

### MicroPython sketch (Pico-class unit, if used instead of ATtiny)

```python
from machine import ADC, PWM, Pin
from time import ticks_us, ticks_diff
from firefly_unit.unit import FireflyUnit, UnitConfig

class PicoHAL:
    def __init__(self):
        self.photo = ADC(26)
        self.amber = PWM(Pin(0)); self.white = PWM(Pin(1))
        self.amber.freq(1000); self.white.freq(1000)
    def read_photosensor(self):
        return self.photo.read_u16() / 65535
    def set_bell_led(self, rgb):
        r, g, b = rgb
        self.amber.duty_u16(int(min(1.0, (r+g)/2) * 65535))
        self.white.duty_u16(int(b * 65535))
    def set_tendril_leds(self, frame):
        ...  # drive the addressable tendril string

hal = PicoHAL()
t0 = ticks_us()
unit = FireflyUnit(hal, clock=lambda: ticks_diff(ticks_us(), t0) / 1e6, config=UnitConfig())
while True:
    unit.step()
```

## B. Dispenser — Raspberry Pi Pico (or Arduino Nano)

| Pure interface | Signal | Pico pin | Notes |
|---|---|---|---|
| `LoadCell.read_lift_grams()` | HX711 DOUT / SCK | GP14 / GP15 | balloon free-lift on the load cell (§4) |
| `HeliumValve.set_open_fraction()` | micro-servo PWM **or** solenoid | GP16 (PWM) / GP17 (gate) | servo pinch-valve or solenoid on the He line |
| LED self-test photodiode | photodiode → ADC | GP26 (ADC0) | confirms the unit blinked (§4 stage 3) |
| start button | button → GPIO in | GP2 (pull-up) | `Dispenser.start()` |
| all-stop button | button → GPIO in | GP3 (pull-up) | `Dispenser.all_stop()` |
| release gate servo | servo PWM | GP18 | opens the gate to release one unit |
| magazine advance | servo/stepper | GP19 | loads the next envelope |

Loop: read HX711 → `BuoyancyController.step()` sets the valve; run `Dispenser.tick(now)`
each control period; poll the two buttons into `start()` / `all_stop()`. HX711,
servo and button drivers are the only board-specific code; all decision logic is the
tested Python ported to MicroPython/C.

**Helium handling** (spec §6): helium is an asphyxiant in enclosed spaces and cylinders
are high-pressure — the valve only *meters* from a regulated low-pressure line; the
firmware never controls the cylinder regulator.
