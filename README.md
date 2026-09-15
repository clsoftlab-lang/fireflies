# Fireflies (반딧불이)

**English** · [한국어](README.ko.md)

> ### *A sky full of drifting light.*
> Hundreds of tiny helium **sky-jellyfish** — glowing bells with swaying tendrils — let go into
> the dusk air, blinking together in slow, self-organising rhythm, like jellyfish adrift in a
> night sea. Gentle art. Safe. Leave no trace.

Fireflies is an open-source night-sky art project. We release a cloud of thumbnail-size,
self-lit floaters and then **let the wind carry them**. There is no GPS, no steering, no
formation. Each unit only floats and blinks. The drifting *is* the art.

**Project lead:** CLSOFTLAB (씨엘소프트랩), Dr. Lee Il-guk (이일국 박사)
**Contributors:** LWJ (high-school student, Gyeonggi-do), LMJ (middle-school student, Gyeonggi-do),
and Claude (Anthropic's AI). Designed with Claude; **this is not an Anthropic product.**

> [!IMPORTANT]
> **The simulator is the show you can run today.** Open [`sim/`](sim/) in any browser and watch
> thousands of light-jellyfish drift and fall into sync — no hardware, no build step. The
> physical units are an honest reference design; real balloons that lift electronics are bigger
> than the 2 cm dream, and free flight needs permits. See **[Safety & airspace](#safety--airspace)**
> before any real flight.

---

## The one idea: we don't steer them, the wind does

This project began at a riverside at dusk. Clouds of tiny insects drift and swirl on the air,
and real fireflies blink in a rhythm that slowly falls into unison. Fireflies recreates that
feeling with light.

A single button *starts* the show — it releases the units and lights them. After that, **the wind
does the choreography** (principle F1 in the [design spec](docs/en/00-design-spec.md)). No position
holding, no collision avoidance, no drawing letters in the sky. This is the opposite of a
commercial drone light show, and it is what makes Fireflies simple, cheap, and small enough to be
genuinely thumbnail-sized. Drifting apart is not a failure — it is the whole point.

## Two forms: sky-jellyfish and firefly

The same floating, wind-drifting, self-blinking unit comes in two visual forms:

- **Sky-jellyfish (해파리) — the v1 form.** The helium balloon is the *bell*; from it hang 3–8
  feather-light **tendrils**, each carrying a line of micro-LEDs. In the air the tendrils sway and
  trail on the wind exactly like a jellyfish drifting on a current. The light runs **down each
  tendril, top to bottom, in a slow wave**, so the whole thing looks like it is gently pulsing and
  swimming.
- **Firefly — the simpler variant.** A single point of light that blinks: scattered sparks over a
  river.

The [simulator](sim/) draws both.

## How they blink together (no leader)

Each unit carries a tiny internal clock. Its "phase" ramps up smoothly and, when it reaches the top,
the unit flashes and resets. Whenever a unit *sees* a bright neighbour flash — with a little light
sensor — it nudges its own phase forward a touch. That is the only rule, and nobody is in charge.
Yet across a whole drifting swarm, random blinking slowly pulls itself into waves of unison. This is
a **pulse-coupled oscillator** (the Mirollo–Strogatz model), the same trick real fireflies use, and
light is the only channel — no radio, no coordinator. The [simulator](sim/) runs the identical model,
so what you watch on screen is what the hardware aims for.
[Read the friendly, illustrated-in-words explanation →](docs/en/05-synchrony-explained.md)

## A spark-like flash — with no spark

A steady micro-LED is too dim to see at dusk, which is exactly when a firefly show is magical. We
want the sharp, bright *pop* of an electric spark — so each unit makes a **capacitor-boosted LED
flash**: a small capacitor charges quietly, then dumps into the LED for a brief, intense burst, like
a camera flash. It is dark between flashes and snaps bright at the peak, staying visible far across a
dusk sky, and a touch of cool white/blue mixed into the amber can even mimic a spark's colour.

**We never put a real spark or any ignition source on a flying unit.** A free-drifting object can
land anywhere — dry grass, a rooftop, a crowd — and a spark is a fire risk (it is also a one-shot
click, not the gentle repeating blink of a firefly). The capacitor flash gives the crisp spark-like
look with no flame and no ignition, light enough for a micro-balloon. See
[design spec §5.1](docs/en/00-design-spec.md#51-brightness--a-spark-like-flash-without-a-spark).

## Try it now

The simulator **is** the landing experience — the full-scale dream, shareable by a link.

- **In this repo:** open [`sim/index.html`](sim/index.html) in any modern browser (no install, no build).
- **On the web:** <https://clsoftlab-lang.github.io/fireflies/sim/> *(published from `sim/` via GitHub Pages)*.

Play with the number of units, wind strength, blink period, coupling strength and colour, and watch
random flashes drift into slow unison.

## Repository map

```
docs/en, docs/ko   design spec, build guide, safety, leave-no-trace, synchrony
sim/               browser simulator (HTML/CSS/JS, no build) + tests  ← start here
hardware/          firefly/jellyfish unit + dispenser: OpenSCAD parts, BOM, wiring
firmware/          blink + sync firmware (unit) and dispenser controller
site/              optional project page (the simulator is the real landing page)
```

The [design spec](docs/en/00-design-spec.md) is the single source of truth. The `sim/`, `hardware/`
and `firmware/` folders are built by parallel work from that spec; if a folder is not populated in
your checkout yet, the simulator and docs still stand on their own.

## Build it

Order of work — try the simulator first, then build up:

1. **Run the [simulator](sim/)** to understand the drift-and-sync behaviour.
2. **Build one jellyfish (or firefly) unit:** a metallised-film or biodegradable-latex micro-balloon
   *(bell)*, a micro-LED with a capacitor-boosted flash, the smallest coin/film cell that stays
   inside the lift budget, a tiny ATtiny-class blink circuit, and an optional phototransistor for
   sync. For the jellyfish form, add 3–8 feather-light LED tendrils.
3. **Build the dispenser** — one 3D-printable desktop machine that fills a balloon with helium,
   **trims it to near-neutral buoyancy** on a tiny load cell, arms and light-tests the LED, and
   releases units one at a time on a start button (which is also an all-stop).
4. **Run an indoor / tethered show** — the default, legal-anywhere mode.

Full steps and commands: **[Build guide](docs/en/01-build-guide.md)** ·
parts and prices: **[Bill of materials](docs/en/02-bill-of-materials.md)** ([bom.csv](docs/bom.csv)).

> [!NOTE]
> **Honest about size.** A true 2 cm thumbnail unit that carries a micro-LED, a cell and a circuit
> *and* still floats does not exist with today's off-the-shelf parts. The **2 cm unit is
> simulator-only**; the reference *hardware* unit is the smallest we can actually build.
> **The buoyancy one-liner:** helium gives roughly **1 gram of lift per litre** it displaces
> (lift ≈ (air − helium density) × volume × *g*), so a 2 cm balloon (~4 mL) lifts only a few
> milligrams — far less than any real LED and cell. Bigger bell, more lift; trim it until it hangs.

## Safety & airspace

> [!WARNING]
> **Read [Safety & airspace](docs/en/03-safety-and-airspace.md) before any real flight.**
>
> - **Default mode is indoor or tethered** — each unit on a fine, retrievable line. This is the
>   fully-legal-anywhere way to run a show, and it is what the whole reference design is built around.
> - **Free wind-release is advanced and permit-required.** Free-floating lit objects are a hazard
>   to aircraft and are restricted in most countries. In Korea the **Aviation Safety Act**
>   (항공안전법) governs light shows, balloon releases and airborne devices — permission and
>   coordinates are required. Only open, low-altitude, permitted sites, coordinated with local
>   aviation authorities.
> - **Never fly near aircraft or airports, over crowds or roads, or in wildlife-sensitive areas**
>   without review.
> - **Helium is an asphyxiant** in enclosed spaces and cylinders are high-pressure — handle per the
>   hardware guide. Use the smallest safe battery; never release a damaged cell.

## Leave no trace

> [!IMPORTANT]
> **Read [Leave no trace](docs/en/04-leave-no-trace.md).** A firefly is not litter.
>
> - Prefer **tethered + recovered** operation, where nothing is lost.
> - Any free-release uses a **biodegradable envelope**, a **cellulose/paper LED carrier** and a
>   **recoverable or compostable** power source where possible.
> - **Released count must equal recovered/accounted count.** Log every unit and organise collection.
> - There is **no "release thousands and walk away" mode**, and there never will be.

## Contributors

- **Dr. Lee Il-guk (이일국 박사), CLSOFTLAB (씨엘소프트랩)** — project lead and design.
- **LWJ** — contributor (high-school student, Gyeonggi-do).
- **LMJ** — contributor (middle-school student, Gyeonggi-do).
- **Claude (Anthropic's AI)** — design collaborator.

New contributors are very welcome, **especially students and young makers.** See
[CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## Sister projects

- [Open Walking Safety Helmet](https://github.com/clsoftlab-lang/open-walking-safety-helmet)
- [RoboSoul humanoid](https://github.com/clsoftlab-lang/robosoul-humanoid)

## Licences

Open licences only:

- **Software** (`sim/`, `firmware/`, scripts, CI): Apache-2.0 — [`LICENSES/Apache-2.0.txt`](LICENSES/Apache-2.0.txt)
- **Hardware** (`hardware/`: OpenSCAD, STL, wiring): CERN-OHL-P-2.0 — [`LICENSES/CERN-OHL-P-2.0.txt`](LICENSES/CERN-OHL-P-2.0.txt)
- **Documentation** (`docs/`, READMEs, images): CC BY 4.0 — [`LICENSES/CC-BY-4.0.txt`](LICENSES/CC-BY-4.0.txt)

See [`NOTICE`](NOTICE) for which licence applies where, and [`LICENSE`](LICENSE) for the full text.

## Not an Anthropic product

Fireflies was designed with Claude, Anthropic's AI assistant. It is an independent open-source
project by CLSOFTLAB. It is **not** an Anthropic product and is not endorsed by Anthropic; there is
no affiliation, and no Anthropic or Claude branding is used.

## Why

Because a riverside at dusk, with the air full of small drifting lights blinking slowly into one
rhythm, is one of the quietest, most beautiful things there is — and everyone should be able to make
one, safely, and leave the river exactly as they found it.
