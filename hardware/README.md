<!--
SPDX-License-Identifier: CERN-OHL-P-2.0
SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
-->
# Fireflies hardware — sky-jellyfish unit + dispenser machine

Reference hardware for the [design spec](../docs/en/00-design-spec.md). Two things:

1. the flying **sky-jellyfish (해파리)** unit — a helium micro-balloon *bell* with glowing
   *tendrils* (spec §3, §3.1), and
2. the desktop **dispenser machine** that fills a balloon to near-neutral buoyancy,
   arms + self-tests the LED payload, and releases units on a button (spec §4).

> **Read the safety and leave-no-trace sections of the spec first** (§6, §7). Free
> release of lit floating objects is airspace-restricted; the default modes are
> **indoor** or **tethered + recovered**. Nothing here is a drone, a formation, or a
> targeting system — the wind does the choreography and we do not steer anything.

Firmware for both lives in [`../firmware/`](../firmware/) (pure, host-tested Python +
ATtiny/Pico porting notes).

---

## 1. Bill of materials — sky-jellyfish unit

The unit is **mass-budget-critical**: every milligram below the bell eats into the
balloon's free lift (see §3). Choose the lightest option you can source.

### 1a. The bell (envelope) — two choices

| Option | What | Pros | Cons | Leave-no-trace |
|---|---|---|---|---|
| **Metallised film** ("foil") micro-bubble, ~13–20 cm | Mylar/nylon film balloon | Holds helium for **days**; low permeability; robust; self-sealing valve | **Not biodegradable**; must be recovered; conductive film near electronics | ❌ recover every unit — never free-release foil |
| **Biodegradable latex** micro-balloon, ~15–25 cm | Natural-rubber latex | Breaks down in the environment; non-conductive | Leaks helium in **hours**; shorter show; lift drops as it deflates | ✅ preferred for any permitted free-release, with full recovery logging |

**Rule (spec §7):** for any free-release, use the **latex** bell + a cellulose/paper
carrier + a recoverable/compostable cell, and a released-count == recovered-count log.
Foil is for **tethered indoor** shows where every unit comes back.

### 1b. Payload

| Part | Choice | Typical mass | Notes |
|---|---|---|---|
| Amber LED (base glow) | 0402 or 0603, ~590 nm | ~2 mg (0402) / ~4 mg (0603) | firefly colour (spec §3) |
| Cool-white LED(s) (flash) | a few 0402 | ~2 mg each | mixed into amber for the spark tint (§5.1) |
| Boost capacitor | 100 µF class, small tantalum/ceramic | ~30–200 mg | charges quietly, dumps into the LED (§5.1) |
| MCU | ATtiny85 / ATtiny1616 (SOIC/QFN or bare die) | ~10 mg (die) / ~70 mg (SOIC) | firmware sync; **OR** a discrete analog blinker (no sync) |
| Sync sensor | 1 × phototransistor (small SMD) | ~5 mg | sees neighbours' flashes (§5) — optional |
| Power | smallest cell that fits the budget | ~50–150 mg (thin-film) / ~600 mg (CR1025 coin) | thin-film/printed cell is lightest; coin cell for longer runtime |
| Tendrils | 3–8 strands: conductive thread **or** micro-film ribbon + micro-LEDs | ~5–20 mg per strand | must hang and sway softly, not stiff (§3.1) |
| Payload carrier / tendril spreader | **die-cut cellulose/paper** (free-release) **or** the printed light ring (`jellyfish_carrier`) | ~20–50 mg (paper) / ~200–400 mg (printed PLA) | the printed ring is only viable on larger balloons — see mass budget |

An **analog-only firefly** (single amber LED + cell + relaxation-oscillator blinker +
boost-cap flash, no MCU/phototransistor) is the cheapest, lightest build. It just
blinks; it does not synchronise.

---

## 2. Bill of materials — dispenser machine

| Part | Choice | Notes |
|---|---|---|
| Controller | Raspberry Pi Pico **or** Arduino Nano | runs the fill/trim/test/release firmware |
| Helium valve | 9 g micro-servo pinch-valve **or** small solenoid, on a low-pressure silicone line | meters helium (spec §4 stage 2); **downstream of a regulator** — never the cylinder valve |
| Buoyancy sensor | bar **load cell** (≈100 g range) + **HX711** 24-bit amp | resolves sub-0.1 g free lift for near-neutral trim (§F2) |
| LED self-test | photodiode (5 mm) in the printed hood | confirms the unit blinked before release (§4 stage 3) |
| Release | micro-servo gate + printed magazine + gate | one unit at a time (§4 stages 1, 4) |
| Frame | 3D-printed parts below | 220 × 220 × 250 mm bed |
| Fasteners | M3 screws/heat-inserts, servo horns | mounting grid on the frame base |
| Helium | party-grade He, **regulated**, in a ventilated space | asphyxiant in enclosed spaces; cylinders high-pressure (§6) |

### 3D-printed parts (`openscad/`)

| Part file | STL | What it is |
|---|---|---|
| `dispenser_frame.scad` | `stl/dispenser_frame.stl` | base plate + upright back panel + gusset ribs; mounting grid |
| `balloon_magazine.scad` | `stl/balloon_magazine.stl` | slotted magazine feeding flat empty envelopes one at a time |
| `release_gate.scad` | `stl/release_gate.stl` | servo gate housing + slider that frees one unit |
| `servo_valve_mount.scad` | `stl/servo_valve_mount.stl` | holds the micro-servo + anvil for the helium pinch-valve |
| `load_cell_mount.scad` | `stl/load_cell_mount.stl` | fixed clamp for the bar load cell + separate moving tether platform |
| `led_test_jig.scad` | `stl/led_test_jig.stl` | dark hood + photodiode bore for the LED self-test |
| `electronics_tray.scad` | `stl/electronics_tray.stl` | tray with standoffs for the Pico + HX711 |
| `jellyfish_carrier.scad` | `stl/jellyfish_carrier.stl` | **the only flying printed part**: a feather-light tendril-spreader ring |
| `lib/common.scad` | — | shared helpers (rounded boxes, holes, bosses, bed-fit check) |

Wiring diagrams: [`wiring/jellyfish_unit.svg`](wiring/jellyfish_unit.svg),
[`wiring/dispenser.svg`](wiring/dispenser.svg).

---

## 3. Buoyancy physics — and the honest size limit

A balloon floats because the helium inside displaces heavier air. The **gross lift**
is the weight of air displaced minus the weight of the helium:

```
lift  ≈  (ρ_air − ρ_He) × Volume
ρ_air ≈ 1.225 g/L,  ρ_He ≈ 0.166 g/L   (sea level, ~15 °C)
⇒  lift ≈ 1.06 g of lift per litre of helium
```

So a payload of **X grams needs ≈ X / 1.06 litres** of helium — i.e. a balloon of at
least that volume. For a sphere of diameter *d*, `V = (4/3)·π·(d/2)³`. Worked examples
(these are the numbers the firmware's `buoyancy.helium_litres_for_lift()` uses):

| Sphere Ø | Helium volume | Gross lift |
|---:|---:|---:|
| **20 cm** | 4.19 L | **≈ 4.44 g** (4.4 g) |
| 18 cm | 3.05 L | ≈ 3.24 g |
| 15 cm | 1.77 L | ≈ 1.87 g |
| **6 cm** | 0.113 L | **≈ 0.12 g** (120 mg) |
| **2 cm** | 0.0042 L | **≈ 0.0044 g** (4.4 mg) |

**Net (free) lift = gross lift − envelope film mass − payload mass**, and near-neutral
trim means free lift is a hair above zero (the dispenser targets ~+0.2 g so the unit
hangs and drifts, not shoots up).

### Mass budget for the unit

| Build | Payload mass (typical) | Envelope film | Balloon needed (gross lift ≥ film + payload + ~0.2 g trim) |
|---|---:|---:|---|
| **Analog firefly** (1 amber LED, thin-film cell, analog blinker, paper carrier) | ~0.15–0.4 g | ~1.5 g (foil) / ~1.0 g (latex) | ~15–18 cm (≈1.9–3.2 g gross) |
| **Full sky-jellyfish** (MCU + phototransistor + boost cap + cool-white + 6 tendrils + printed/paper carrier) | ~0.7–2.0 g | ~1.5 g | ~18–22 cm (≈3.2–5.5 g gross) |

Note how the **printed carrier ring** (~0.2–0.4 g PLA) alone is 2–3× the *entire* free
lift of a 6 cm balloon (0.12 g). That is why free-release units use a die-cut
cellulose/paper carrier (~20–50 mg) instead, and why the bell must be 15 cm+.

### The honest limit (spec §3, §3.1)

A true **2 cm thumbnail** unit lifts only **~4.4 mg** — far less than a single coin
cell (hundreds of mg) or even a bare LED + die. **A 2 cm self-lit floater does not
exist with today's off-the-shelf parts.** The 2 cm dream is **simulator-only**; the
smallest *buildable* reference unit is the 15–22 cm sky-jellyfish above. We document
both honestly rather than pretend the thumbnail flies.

---

## 4. Build & verify

Render every part to STL + a preview PNG, then check bed-fit:

```powershell
# from hardware/
pwsh scripts/render_all.ps1        # or: bash scripts/render_all.sh
python scripts/check_stl.py        # non-empty + fits 220 x 220 x 250 mm
```

`render_all` writes STLs to `stl/` and PNGs to `renders/`. `check_stl.py` reports each
part's triangle count and bounding box and fails if anything is empty or too big. All
eight parts currently pass and fit the bed.

Firmware tests (from `../firmware/`): `python -m pytest tests -q`.

---

## 5. Safety notes (see spec §6, §7)

- **Helium** is an asphyxiant in enclosed spaces; cylinders are high-pressure. The
  servo valve only meters a **regulated low-pressure** line — the firmware never
  touches the cylinder regulator. Work in a ventilated space.
- **No ignition source ever flies.** The "spark-like" look is a capacitor-boosted LED
  flash (§5.1), never a real spark. A free-drifting object can land anywhere.
- **Default modes are indoor or tethered + recovered.** Free release is airspace-
  restricted (in Korea, the Aviation Safety Act) and is "advanced / permit required".
- **Leave no trace:** latex bell + cellulose carrier + recoverable cell for any free
  release; log released == recovered.
- **Batteries:** smallest safe cell; never release a damaged cell.

Licence: hardware **CERN-OHL-P-2.0**. See [`../LICENSES/`](../LICENSES/).
