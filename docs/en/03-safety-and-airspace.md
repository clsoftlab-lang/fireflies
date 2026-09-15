# 03 · Safety & airspace

> Part of Fireflies · CC BY 4.0 · © 2026 CLSOFTLAB, Dr. Lee Il-guk

> [!WARNING]
> **Read this in full before any real flight.** Fireflies is gentle art, but anything that floats
> and lights up shares the sky with aircraft, people and wildlife. The default, legal-anywhere mode
> is **indoor or tethered**. Free wind-release is **advanced and permit-required** — never the
> default. This guide expands [design spec §6](00-design-spec.md#6-safety-and-airspace-must-read-before-any-real-flight);
> the spec wins if they disagree.

This document is general guidance, **not legal advice**. Laws differ by country and change over
time. You are responsible for checking and following the rules where you fly, and for getting any
permits before you fly.

## Contents

1. [The two modes](#1-the-two-modes)
2. [Aircraft & airspace](#2-aircraft--airspace)
3. [Korea: Aviation Safety Act](#3-korea-aviation-safety-act)
4. [Altitude, crowds & wildlife](#4-altitude-crowds--wildlife)
5. [Helium handling](#5-helium-handling)
6. [Battery safety](#6-battery-safety)
7. [Pre-flight checklist](#7-pre-flight-checklist)

---

## 1. The two modes

| Mode | What it is | Legality | When to use |
|---|---|---|---|
| **Indoor / tethered** *(default)* | Indoors, or each unit on a fine, retrievable line outdoors in still air | Legal-anywhere with normal venue permission | Almost always. The whole reference design targets this. |
| **Free wind-release** *(advanced)* | True wind drift, nothing tethered | **Permit required**; restricted or banned in many places | Only open, low-altitude, permitted sites, coordinated with aviation authorities, biodegradable units, full recovery |

If you are not sure which mode you are in, you are in free-release, and you need a permit.

## 2. Aircraft & airspace

- **Aircraft safety comes first, always.** Free-floating lit objects near airports or in controlled
  airspace are a genuine hazard to aircraft and are restricted in most countries.
- **Never fly near airports, heliports, or in controlled airspace.** Keep clear of approach and
  departure paths.
- Free-floating balloons cannot see or avoid anything (that is the point of principle F1 — the wind
  steers, not us), so the only safe free-release is one that authorities have reviewed for the exact
  place, time, altitude and recovery plan.
- Tethered and indoor operation avoids airspace entirely, which is why it is the default.

## 3. Korea: Aviation Safety Act

In Korea, the **Aviation Safety Act (항공안전법)** and its subordinate rules govern light shows,
balloon releases and airborne devices. In practice this means:

- **Permission and coordinates are required** for outdoor free-release or any airborne light show.
  Apply to the relevant aviation authority with the exact location, date/time window, maximum
  altitude, number of units and a recovery plan.
- **Airport / no-fly zones:** releases near airports and within controlled or restricted airspace
  are prohibited without specific clearance. Check the current zones before planning.
- **Altitude and notice:** stay within any altitude limit the authority sets, and give the required
  notice period.
- Rules change; always confirm the **current** requirements with the authority before you fly. When
  in doubt, run the show **indoor or tethered**, which does not require an airspace permit.

Other countries have their own equivalents (for example national civil aviation authority rules on
free balloons and outdoor light displays). The same principle holds everywhere: **free-release needs
a permit; tethered/indoor does not.**

## 4. Altitude, crowds & wildlife

- **Keep altitude low** — the art is a drifting dusk glow, not a high-altitude flight. Lower is
  safer for aircraft and for recovery.
- **No flight over crowds or roads** without review: a unit can come down anywhere, and a startled
  crowd or a distracted driver is a hazard even from a harmless object.
- **Protect wildlife.** Avoid wildlife-sensitive areas, nesting seasons and water bodies where units
  could be mistaken for food or entangle animals. Biodegradable materials and full recovery (see
  [04 · Leave no trace](04-leave-no-trace.md)) are part of this.
- **Weather:** do not release in gusty or unsettled wind, near storms, or when you cannot keep the
  drift within your permitted, recoverable area.

## 5. Helium handling

Helium is not flammable, but it has two real hazards:

- **Asphyxiant in enclosed spaces.** Helium displaces air. In a small or poorly-ventilated room it
  can lower oxygen to dangerous levels. **Fill and run indoors only with good ventilation.** Never
  breathe helium.
- **High-pressure cylinders.** A helium cylinder stores gas under high pressure and can become a
  dangerous projectile if the valve is damaged.
  - Secure the cylinder upright so it cannot fall.
  - Use a proper regulator; open the valve slowly.
  - Keep away from heat; do not drop or knock it.
  - Close the valve when not filling; store and transport per the supplier's instructions.
- Follow the detailed handling rules in `hardware/` (the dispenser puts a controlled valve on the
  helium line for exactly this reason — design spec §4).

## 6. Battery safety

- Use the **smallest safe cell** that meets the buoyancy budget — small cells are lighter *and*
  store less energy, so a fault is less serious.
- **Never release a damaged, swollen, leaking or overheated cell.** It fails the pre-flight check.
- Do not short coin/film cells; keep spares in their packaging, away from metal (keys, coins).
- Dispose of cells through proper battery recycling — this is also part of
  [04 · Leave no trace](04-leave-no-trace.md).
- Keep cells away from small children and pets: coin cells are a swallowing hazard.

## 7. Pre-flight checklist

Before any show:

- [ ] Mode confirmed: **indoor / tethered** (default), or **free-release with a written permit**.
- [ ] For free-release: aviation authority permission obtained, coordinates/altitude/time filed,
      no airport or controlled/restricted airspace, weather within limits.
- [ ] No flight over crowds, roads or wildlife-sensitive areas without review.
- [ ] Ventilation adequate; helium cylinder secured; regulator fitted.
- [ ] Every unit light-tested and **logged**; released count planned to equal recovered count.
- [ ] No damaged cells; smallest safe cell used.
- [ ] Recovery plan and kit ready (see [04 · Leave no trace](04-leave-no-trace.md)).
- [ ] Start button / all-stop working; a plan to bring tethered units down is in place.

If any box is unchecked, do not fly. Run the simulator instead — it has no airspace at all.
