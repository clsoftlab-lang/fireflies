# 01 · Build guide

> Part of Fireflies · CC BY 4.0 · © 2026 CLSOFTLAB, Dr. Lee Il-guk

This guide takes you from *watching* Fireflies in your browser to *running* a small indoor show.
Work in order — each step builds on the one before. The [design spec](00-design-spec.md) is the
single source of truth; if this guide and the spec ever disagree, the spec wins, so please
[open an issue](https://github.com/clsoftlab-lang/fireflies/issues).

> [!WARNING]
> Do not skip [03 · Safety & airspace](03-safety-and-airspace.md) and
> [04 · Leave no trace](04-leave-no-trace.md) before any real flight. The default, legal-anywhere
> mode is **indoor or tethered**. Free wind-release is advanced and permit-required.

## Contents

1. [Step 1 — Try the simulator](#step-1--try-the-simulator)
2. [Step 2 — Build one jellyfish unit](#step-2--build-one-jellyfish-unit)
3. [Step 3 — Build the dispenser](#step-3--build-the-dispenser)
4. [Step 4 — Run an indoor / tethered show](#step-4--run-an-indoortethered-show)
5. [Where the exact commands live](#where-the-exact-commands-live)

---

## Step 1 — Try the simulator

The simulator is the whole dream at full scale, and it needs no hardware. **Start here.**

- **Just open it:** double-click [`sim/index.html`](../../sim/index.html), or open it in any modern
  browser. There is no build step and no server.
- **On the web:** <https://clsoftlab-lang.github.io/fireflies/sim/>.

Play with the controls (number of units, wind strength, blink period, coupling strength, colour)
until the behaviour feels familiar: units drift on a gentle wind field, and their random flashes
pull into slow waves of unison. This is exactly what the hardware aims to reproduce, so it is the
best possible reference before you pick up a soldering iron.

**Run the simulator's tests** (Node.js 20+; the tests live under `sim/tests/`):

```bash
node --test sim/tests
```

This is the same command the [CI workflow](../../.github/workflows/ci.yml) runs on every change.

> The pulse-coupled sync model the simulator uses is explained, in plain words, in
> [05 · Synchrony explained](05-synchrony-explained.md). The firmware uses the identical model.

---

## Step 2 — Build one jellyfish unit

Goal: the smallest, lightest self-lit floater that drifts on indoor air. Build **one** and get it
blinking before you build many. The unit comes in two forms (design spec §3.1):

- **Firefly form** — a single blinking point of light.
- **Sky-jellyfish form (v1)** — the balloon is the *bell*, with 3–8 feather-light glowing
  **tendrils** hanging from it. Build the firefly form first; add tendrils once it flies and blinks.

Parts (see [02 · Bill of materials](02-bill-of-materials.md) for the full list and prices):

| Part | Choice | Why |
|---|---|---|
| Envelope (bell) | Metallised-film micro-bubble ~5–8 cm, **or** biodegradable latex micro-balloon | Foil holds helium longer; latex breaks down better. 2 cm is simulator-only. |
| Lift gas | Helium, trimmed to **near-neutral buoyancy** | It should hover and drift, not shoot up or sink. |
| Light | 1 × micro-LED, warm amber (~590 nm) + a **capacitor-boosted flash** | Amber matches fireflies; the capacitor gives the sharp, spark-like *pop* (spec §5.1) with **no spark**. |
| Power | Smallest coin/film cell inside the lift budget | Minutes to a couple of hours of runtime. |
| Blink circuit | ATtiny-class microcontroller, **or** a discrete analog blinker | Firmware enables synchrony; the analog option just blinks. |
| Sync sensor (optional) | 1 × phototransistor | Lets a unit see neighbours' flashes and fall into rhythm. |
| Tendrils (jellyfish form) | 3–8 light strands, a few micro-LEDs each | Must hang and sway softly; every milligram stays inside the free-lift budget. |

Build order for one unit:

1. **Assemble the LED payload:** micro-LED + capacitor-boosted flash driver + smallest cell +
   ATtiny-class blink circuit (+ optional phototransistor). Keep it feather-light.
2. **Flash the blink/sync firmware** and confirm the LED does the crisp capacitor *pop*, not a dim
   steady glow. Two to five units placed near each other should fall into sync by light alone.
3. **Fill and trim the bell:** add helium until the balloon **neither rises fast nor sinks** — it
   hovers. This trim is the make-or-break skill (spec F2). The buoyancy rule of thumb: helium lifts
   roughly **1 gram per litre** it displaces, so the payload mass sets the smallest balloon you can use.
4. **Attach the payload** below the bell so the unit is near-neutral overall.
5. **(Jellyfish form)** add 3–8 tendrils, each a light strand with a few micro-LEDs, so the light
   runs **down each tendril top→bottom in a slow wave**. Keep them light enough to sway, not stiff.

> [!NOTE]
> **The 2 cm thumbnail unit is simulator-only.** A real balloon that lifts even a micro-LED, a cell
> and a circuit is bigger. Build the smallest unit that actually floats, and be honest about it.

---

## Step 3 — Build the dispenser

The dispenser is one 3D-printable desktop machine that turns raw balloons + a helium source into
finished, glowing, neutrally-trimmed units and releases them on a button (design spec §4).

Reference parts: a Raspberry Pi Pico or Arduino-class controller, a micro servo/solenoid valve on
the helium line, a load cell + HX711-class amplifier for buoyancy, an LED-test photodiode, and a
3D-printed frame, magazine and release gate. Full BOM and wiring live in `hardware/`.

The five stages it automates:

1. **Load** an empty envelope from the magazine.
2. **Fill** with helium to a target free-lift, measured on the load cell, so the unit is **trimmed
   near neutral**. Firmware closes the valve at target.
3. **Attach & arm** the LED payload and run a **light self-test** (blink once) so no dead unit is
   released.
4. **Release** one unit at a time, or a gentle rhythm of them, on the operator's start signal.
5. **Start button / all-stop:** the start button is the *only* live control ("begin releasing"); it
   is also an all-stop, plus a documented plan for bringing tethered units down.

Print the parts, wire per `hardware/`, and flash the dispenser controller firmware from `firmware/`.
Bench-test the fill/trim/test/release cycle **with no LED payload and the valve closed** first, then
with one unit.

---

## Step 4 — Run an indoor / tethered show

This is the default, legal-anywhere mode, and the target of the whole reference design.

1. Read [03 · Safety & airspace](03-safety-and-airspace.md) and
   [04 · Leave no trace](04-leave-no-trace.md) in full.
2. Choose an **indoor** space, or **tether** each unit on a fine, retrievable line outdoors in still
   air. Ventilate: helium is an asphyxiant in enclosed spaces.
3. Trim each unit near-neutral, light-test it, and **log it**. The released count must equal the
   recovered count.
4. Release a gentle rhythm of units on the start button and watch them drift and sync.
5. **Recover every unit.** Reconcile your count. Leave the space as you found it.

Scale up gradually: one unit on the bench → 2–5 syncing by light → a tethered indoor show of 10–50
(design spec phases P1–P3). Free release (P4) is advanced, permit-required, biodegradable-only, with
full recovery.

---

## Where the exact commands live

This project is built by parallel tracks from the [design spec](00-design-spec.md). The exact,
authoritative commands for each component live in that component's own README as it is populated:

- **Simulator:** `sim/README.md` — run and test (`node --test sim/tests`).
- **Hardware (unit + dispenser):** `hardware/README.md` — parts, printing, wiring, buoyancy trim,
  helium handling. This is the **authoritative BOM**; [02 · Bill of materials](02-bill-of-materials.md)
  is a provisional summary until then.
- **Firmware:** `firmware/README.md` — flashing the blink/sync firmware and the dispenser controller.

If a component folder is not yet in your checkout, follow the design spec sections referenced above
and treat the hardware figures as provisional.
