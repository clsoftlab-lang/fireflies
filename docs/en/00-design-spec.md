# Fireflies (반딧불이) — Design Specification (v0.1)

> **Status:** Concept + reference design v0.1 · **Single source of truth.** The browser simulator,
> the dispenser hardware, the firefly unit and all guides follow this document. Change it first,
> then the implementations.

- Project: **Fireflies (반딧불이)** — an open, gentle night-sky art installation: hundreds of tiny,
  ultra-light LED **sky-jellyfish** (해파리) — helium micro-balloons with glowing tendrils — that are
  released into the air and **left to drift on the wind**, tendrils swaying and light flowing down them,
  blinking in slow, self-organising synchrony, like jellyfish adrift in a night sea (§3.1).
  The v1 form is the **sky-jellyfish**; the plain single-point "firefly" is a simpler variant.
- Project lead: **CLSOFTLAB (씨엘소프트랩), Dr. Lee Il-guk (이일국 박사)**
- Contributors: **LWJ** (high school student, Gyeonggi-do), **LMJ** (middle school student, Gyeonggi-do)
- Designed with Claude (Anthropic's AI). Not an Anthropic product.
- Licences: software Apache-2.0 · hardware CERN-OHL-P-2.0 · documentation CC BY 4.0.

---

## 1. What this is — and what it is not

The idea began at a riverside: at dusk, clouds of tiny insects drift and swirl, pushed by the air, and
real fireflies blink in a rhythm that slowly falls into sync. Fireflies recreates that feeling with
hundreds of thumbnail-size lights.

**The central design choice: we do not control where they go.** A single button "starts" the show —
it releases the fireflies and lights them — and after that **the wind carries them**. There is no GPS,
no position holding, no formation, no steering. Drifting apart is not a failure; it *is* the art.

This makes Fireflies fundamentally different from a commercial drone light show (which precisely
positions each drone to draw letters and logos). It also makes it far simpler, far cheaper, and small
enough to be genuinely thumbnail-sized.

| # | Principle | Consequence |
|---|---|---|
| F1 | **Let the wind do the choreography** | No GPS, no position control, no collision avoidance. Each unit only floats and blinks. |
| F2 | **Barely-there lift** | Each firefly is a helium micro-balloon trimmed to near-neutral buoyancy, so it hangs and drifts rather than shooting up. |
| F3 | **Blink in synchrony, with no leader** | Each unit nudges its blink toward the neighbours it can see (a pulse-coupled oscillator, like real fireflies). Order emerges; nobody is in charge. |
| F4 | **Leave no trace** | Every part that flies is chosen to come down safely and break down in nature, plus a recovery plan. This is a firefly, not litter. See §7. |
| F5 | **Gentle and legal** | Low altitude, tethered or fenced options, clear airspace rules, no hazard to aircraft, people, or wildlife. See §6. |
| F6 | **Anyone can make it** | Globally available parts; the "machine" is one 3D-printable dispenser; the simulator runs in any browser. |
| F7 | **Simulate first, at any scale** | The browser simulator has no size or count limit: thumbnail fireflies, thousands of them, drifting and syncing — the dream, viewable by a link. Reality is documented honestly alongside. |
| F8 | **Open licences** | Apache-2.0 / MIT / BSD / CC-BY only. |

---

## 2. System overview

```
   ┌──────────────── DISPENSER (the "machine") ────────────────┐        the wind
   │  helium micro-fill  →  buoyancy trim  →  LED arm & test    │           ↓
   │  →  release one firefly at a time     ← start button       │   ✦   ✧      ✦
   │  (§4)                                                       │      ✧   ✦  ✧     ✦
   └───────────────────────────┬────────────────────────────────┘   ✦      ✧      ✦
                               │ releases                            drifting + blinking
                               ▼                                     in slow synchrony (§5)
                    ┌──── FIREFLY UNIT (§3) ────┐
                    │ micro-balloon (He)         │
                    │ + micro-LED + coin cell    │
                    │ + tiny blink circuit       │
                    │ near-neutral buoyancy      │
                    └────────────────────────────┘

   BROWSER SIMULATOR (§8): thousands of fireflies released, drifting on a wind field,
   blinking into sync — no hardware needed, shareable by link.
```

Two tracks, both open-sourced:
- **Simulator track** (primary): a browser world where the dream runs at full scale today.
- **Hardware track** (reference design): the firefly unit and the dispenser machine, documented honestly
  including where physics limits real size and flight time.

---

## 3. Firefly unit (reference design, hardware track)

The goal: the smallest, lightest self-lit floater that drifts on indoor/very-light-wind air.

| Part | Choice | Notes |
|---|---|---|
| Envelope | Metallised film ("foil balloon") micro-bubble, ~5–8 cm, OR a biodegradable latex micro-balloon | Foil holds helium longer; latex breaks down better (§7). Thumbnail-size (2 cm) is a **simulator-only** dream today — real balloons that lift any electronics are bigger; documented honestly. |
| Lift gas | Helium, trimmed to **near-neutral buoyancy** | Fill until it neither rises fast nor sinks; it should hover and drift. Trim is the key skill (§4). |
| Light | 1 × micro-LED, warm amber base + a **bright capacitor-boosted flash** | Amber ~590 nm matches fireflies; the flash gives a sharp, spark-like "pop" that is visible at dusk (see §5.1). |
| Power | Smallest coin/film cell that floats within the buoyancy budget | Runtime is minutes to a couple of hours depending on balloon size and blink duty. |
| Blink circuit | Tiny microcontroller (ATtiny-class) OR a discrete analog blinker | Firmware option enables synchrony (§5) via a light sensor; the analog option just blinks. |
| Sync sensor (optional) | 1 × phototransistor | Sees neighbours' flashes to fall into rhythm. |
| Mass budget | Everything below the balloon's free lift | The lighter the payload, the smaller the balloon can be. Minimise every milligram. |

### 3.1 Two forms: firefly and sky-jellyfish

The same floating, wind-drifting, self-blinking unit comes in two visual forms:

- **Firefly form:** a single point of light that blinks — scattered sparks over a river.
- **Sky-jellyfish form (해파리):** the helium balloon is the *bell*, and from it hang several very light,
  glowing **tendrils** — thin conductive thread or micro-film ribbons with a line of micro-LEDs along
  each. In the air, the tendrils sway and trail on the wind exactly like a jellyfish drifting on a
  current — which is the same "let the wind carry it" idea (F1) made visible. Design of the tendrils:
  - **Bell:** the helium micro-balloon provides all the lift; keep the tendrils feather-light so buoyancy
    is barely affected (every milligram of tendril must stay inside the free-lift budget).
  - **Tendrils:** 3–8 strands, each with a few micro-LEDs; the strands must be light enough to hang and
    sway softly, not stiff.
  - **Flowing light:** run the light **down the tendril top→bottom** in a slow wave, so it looks like a
    jellyfish pulsing and swimming (many real jellyfish glow in travelling waves).
  - **Spark flash on the bell:** an occasional capacitor-boosted flash (§5.1) on the bell, over the gentle
    flowing tendrils, gives the crisp "pop" without any ignition source.

The simulator renders both forms; sky-jellyfish are drawn as a bell plus trailing, swaying, light-flowing
tendrils in the wind field.

**Honest limit:** a true 2 cm thumbnail unit that carries even a micro-LED, a cell and a circuit and
still floats does not exist with today's off-the-shelf parts. The reference *hardware* unit is the
smallest we can actually build (documented in `hardware/`); the *simulator* renders the 2 cm dream.

---

## 4. The dispenser machine

One 3D-printable desktop machine that turns raw balloons + a helium source into finished, glowing,
neutrally-trimmed fireflies and releases them on a button.

Stages:
1. **Load** an empty envelope from a magazine.
2. **Fill** with helium to a target free-lift, measured on a tiny load cell / balance so buoyancy is
   **trimmed near neutral** (the make-or-break step behind F2). Firmware closes the valve at target.
3. **Attach & arm** the LED payload; run a **light self-test** (blink once) so no dead unit is released.
4. **Release** one firefly at a time, or a gentle rhythm of them, on the operator's start signal.
5. **Start button / handheld remote**: the *only* live control — "begin releasing". Also an **all-stop**
   (stop releasing) and a documented plan for bringing tethered units down.

Reference build: Raspberry Pi Pico or Arduino-class controller, a micro servo/solenoid valve on the
helium line, a load cell + HX711-class amp for buoyancy, an LED-test photodiode, 3D-printed frame,
magazine and release gate. Full BOM and wiring in `hardware/`.

---

## 5. Synchronised blinking (the heart of it)

Real fireflies with no leader still flash in unison. Each firefly is modelled as a **pulse-coupled
oscillator**: it has an internal phase that ramps to a threshold, flashes, and resets; when it *sees*
a neighbour flash, it nudges its own phase forward a little. Across a swarm, this converges to
synchrony (Mirollo–Strogatz). We implement the same rule:

- Each unit ramps a phase 0→1 over a period T (≈ 1–2 s), flashes at 1, resets.
- On seeing a bright neighbour flash (phototransistor), advance phase by a small coupling ε.
- Result: fireflies that start random slowly blink together — with drift and wind making the pattern
  never quite the same. No radio, no coordinator; light is the only channel.

The **simulator** implements the identical model so what you see on screen is what the hardware aims for.

### 5.1 Brightness — a spark-like flash, without a spark

A single steady micro-LED is too dim to see at dusk, which is exactly when a firefly show is magical.
We want the sharp, bright "pop" of an electric spark — but we **never put a real spark or any ignition
source on a flying unit.** A free-drifting object can land anywhere (dry grass, a crowd, a rooftop), and
a spark is a fire risk; it is also a one-shot "click", not the gentle repeating blink of a firefly.

Instead, each firefly makes a **capacitor-boosted LED flash**: a small capacitor charges quietly, then
dumps into the LED for a brief, intense burst — like a camera flash or a bike tail-light strobe. It is
dark between flashes and snaps bright at the peak, giving the crisp spark-like "pop" and staying visible
far across a dusk sky. A touch of **cool white / blue** mixed into the amber can even mimic the colour of
an electric spark. No flame, no ignition, light enough for the micro-balloon. Peak brightness, flash
duration and colour are firmware parameters; the simulator renders the same sharp flash profile.

---

## 6. Safety and airspace (must-read before any real flight)

- **Aircraft safety first.** Free-floating lit objects near airports or in controlled airspace are a
  hazard and are restricted in most countries (in Korea, the Aviation Safety Act governs light shows,
  balloon releases and any airborne device; permission and coordinates are required). The default,
  fully-legal-anywhere mode is **indoor** or **tethered** (each firefly on a fine line, retrievable).
- **Free release** (true wind drift) is only for open, low-altitude, permitted sites, coordinated with
  local aviation authorities — documented as "advanced / permit required", never the default.
- No flight over crowds, roads, or wildlife-sensitive areas without review.
- Helium is an asphyxiant in enclosed spaces and cylinders are high-pressure — handling rules in `hardware/`.
- Batteries: use the smallest safe cell; never release damaged cells.

## 7. Leave no trace (environmental design)

- Prefer **tethered + recovered** operation (nothing is lost).
- For any free-release: use a **biodegradable envelope**, a **cellulose/paper LED carrier**, and a
  **recoverable or compostable** power source where possible; log how many are released and organise
  collection afterwards. A released count must equal a recovered/accounted count.
- The project will not publish a "release thousands and walk away" mode. Litter is the opposite of a firefly.

---

## 8. Browser simulator (primary deliverable)

A single-page web app (no build step, no external services) that shows the dream at full scale:
- A **wind field** (gentle, time-varying) drifts thousands of fireflies; they spread, swirl and never
  repeat — the riverside feeling.
- Each firefly runs the **pulse-coupled sync** model (§5); the audience watches random blinking fall
  into slow waves of unison.
- A **dispenser** at the bottom releases fireflies over time on a "start" button, matching the hardware story.
- Controls: number of fireflies, wind strength, blink period, coupling strength, colour; pause; a
  "leave no trace" note; accessible (keyboard, reduced-motion, high-contrast), responsive, light/dark.
- Runs at thousands of units on a normal laptop; degrades gracefully on phones.

## 9. Repository layout

```
docs/en, docs/ko          design spec, build guide, safety, environment
sim/                      browser simulator (HTML/CSS/JS, no build), tests
hardware/                 firefly unit + dispenser: OpenSCAD parts, BOM, wiring, firmware
firmware/                 blink + sync firmware (unit) and dispenser controller
site/                     project page (optional)
```

## 10. Phases

| Phase | Scope |
|---|---|
| P0 | Browser simulator: wind drift + pulse-coupled sync at thousands of units |
| P1 | One firefly unit on the bench: blink + sync between 2–5 units by light |
| P2 | Dispenser machine: helium fill + buoyancy trim + LED test + release, indoor/tethered |
| P3 | Tethered indoor show (retrievable), 10–50 units |
| P4 | Free release — only with permits, biodegradable units, full recovery (advanced) |
