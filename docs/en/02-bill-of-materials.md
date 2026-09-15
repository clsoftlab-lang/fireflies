# 02 · Bill of materials

> Part of Fireflies · CC BY 4.0 · © 2026 CLSOFTLAB, Dr. Lee Il-guk

> [!IMPORTANT]
> **This list is provisional.** It is written from [design spec](00-design-spec.md) §3 (firefly
> unit) and §4 (dispenser) while the hardware track is being built. When `hardware/README.md`
> exists, **that file is the authoritative BOM** — quantities, exact part numbers and verified
> buying links live there. Prices below are rough ranges (USD) for planning only and vary by
> country and supplier. See the machine-readable summary in [`bom.csv`](../bom.csv).

Licences: hardware design files are CERN-OHL-P-2.0; the parts themselves are ordinary commodity
components. Use permissively-licensed firmware/tools only (Apache-2.0 / MIT / BSD).

---

## A. Firefly / sky-jellyfish unit (per unit)

The goal is the smallest, lightest self-lit floater. Minimise every milligram: the lighter the
payload, the smaller the balloon can be.

| # | Part | Choice / spec | Qty | Rough price | Notes |
|---|---|---|---|---|---|
| U1 | Envelope (bell) | Metallised-film micro-bubble ~5–8 cm **or** biodegradable latex micro-balloon | 1 | $0.20–1.00 | Foil holds helium longer; latex breaks down better (§7). 2 cm is simulator-only. |
| U2 | Lift gas | Helium, trimmed to near-neutral buoyancy | as needed | see D1 | ~1 g lift per litre displaced. Trim is the key skill. |
| U3 | Light | Micro-LED, warm amber ~590 nm (+ optional cool-white/blue tint) | 1 | $0.05–0.30 | Amber matches fireflies; blue tint mimics a spark's colour. |
| U4 | Flash capacitor | Small ceramic/film cap for the capacitor-boosted flash | 1 | $0.05–0.20 | Gives the sharp, spark-like *pop* (§5.1) — **no real spark**. |
| U5 | Power | Smallest coin/film cell inside the lift budget | 1 | $0.10–0.50 | Runtime minutes to a couple of hours. Never fly a damaged cell. |
| U6 | Blink circuit | ATtiny-class microcontroller **or** discrete analog blinker | 1 | $0.30–1.50 | Firmware enables synchrony; analog just blinks. |
| U7 | Sync sensor (optional) | Phototransistor | 0–1 | $0.05–0.30 | Sees neighbours' flashes to fall into rhythm. |
| U8 | Tendrils (jellyfish form) | 3–8 light strands (thin conductive thread / micro-film ribbon), a few micro-LEDs each | 3–8 | $0.20–1.00 total | Must hang and sway; every milligram inside the free-lift budget. |
| U9 | Carrier / attachment | Cellulose or paper LED carrier, light tether point | 1 | $0.02–0.10 | Biodegradable carrier preferred for free-release (§7). |

**Indicative unit cost:** roughly **$1–5** in small quantities, dominated by the balloon and cell.

---

## B. Dispenser machine (one, reusable)

One 3D-printable desktop machine (design spec §4). Reusable across every show.

| # | Part | Choice / spec | Qty | Rough price | Notes |
|---|---|---|---|---|---|
| D1 | Helium source | Small helium cylinder + regulator | 1 | $30–80 | High-pressure; asphyxiant in enclosed spaces. Handle per `hardware/`. |
| D2 | Controller | Raspberry Pi Pico **or** Arduino-class board | 1 | $4–12 | Runs fill/trim/test/release. |
| D3 | Fill valve | Micro servo **or** solenoid valve on the helium line | 1 | $3–15 | Firmware closes it at target free-lift. |
| D4 | Buoyancy balance | Load cell + HX711-class amplifier | 1 | $3–8 | Measures free-lift so the unit is trimmed near neutral (§F2). |
| D5 | LED self-test | Photodiode | 1 | $0.20–1.00 | Confirms one blink so no dead unit is released. |
| D6 | Frame / magazine / release gate | 3D-printed parts (PLA/PETG) | 1 set | $2–8 filament | OpenSCAD sources in `hardware/` (CERN-OHL-P-2.0). |
| D7 | Start button / all-stop | Momentary button **or** handheld remote | 1 | $1–10 | The only live control: begin releasing / all-stop. |
| D8 | Wiring & misc | Dupont wire, headers, small fasteners | — | $2–6 | Per wiring diagram in `hardware/`. |

**Indicative dispenser cost:** roughly **$50–150** once, plus filament and helium refills.

---

## C. Consumables & recovery kit (per show)

| # | Part | Notes |
|---|---|---|
| C1 | Fine tether line (spools) | For the default tethered mode — retrievable. |
| C2 | Recovery bags / log sheet | Released count **must** equal recovered count (§7). |
| C3 | Spare cells, spare envelopes | Never fly a damaged cell. |

---

## D. Simulator

**$0.** The [simulator](../../sim/) runs in any browser with no hardware and no build step. Tests run
with `node --test sim/tests` (Node.js 20+).
