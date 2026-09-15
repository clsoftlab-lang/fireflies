# 05 · Synchrony explained

> Part of Fireflies · CC BY 4.0 · © 2026 CLSOFTLAB, Dr. Lee Il-guk

How do hundreds of little lights, with no leader and no radio, end up blinking together? This is the
heart of Fireflies, and the good news is that the idea is simple enough to explain with a stadium
crowd and a running tap. It expands [design spec §5](00-design-spec.md#5-synchronised-blinking-the-heart-of-it);
the **simulator and the firmware both run the exact model at the bottom of this page.**

## Contents

1. [The picture: a stadium of metronomes](#1-the-picture-a-stadium-of-metronomes)
2. [One firefly as a filling bucket](#2-one-firefly-as-a-filling-bucket)
3. [The nudge](#3-the-nudge)
4. [Why it ends in unison (Mirollo–Strogatz)](#4-why-it-ends-in-unison-mirollostrogatz)
5. [The exact model the sim and firmware use](#5-the-exact-model-the-sim-and-firmware-use)
6. [Things to try in the simulator](#6-things-to-try-in-the-simulator)

---

## 1. The picture: a stadium of metronomes

Imagine a stadium full of people, each clapping at their own steady pace but starting at random
moments. It sounds like noise. Now give everyone one instruction: *"each time you hear a big clap
from the crowd, clap a tiny bit sooner next time."* Nobody leads, nobody counts — yet within a
minute the whole stadium is clapping in unison. Real fireflies do the same thing with light, and so
does Fireflies. **Order emerges; nobody is in charge.**

## 2. One firefly as a filling bucket

Think of each firefly as a bucket slowly filling with water from a tap:

- The water level is the firefly's **phase**, a number that climbs smoothly from **0 to 1**.
- It takes a fixed time **T** (the *period*, about 1–2 seconds) to fill.
- The instant the bucket is full (phase reaches 1), the firefly **flashes** and the bucket
  **empties** back to 0. Then it starts filling again.

Left alone, a firefly just flashes every T seconds forever, on its own rhythm. A field of them,
started at random, flashes in a random sprinkle — no pattern.

## 3. The nudge

Now add the one rule that creates order. Each firefly can *see* light with a small sensor
(a phototransistor). **When a firefly sees a bright neighbour flash, it bumps its own water level up
a little** — by a small amount called the **coupling strength, ε (epsilon).**

That is the entire mechanism:

- If a neighbour flashes when your bucket is nearly full, the nudge tips you over the top, so you
  flash almost together **now** — and from then on you stay together.
- If it flashes when your bucket is nearly empty, the small nudge barely matters yet, but it still
  pulls you slightly toward the crowd.

Do this across a whole swarm and the flashes pull each other into step. Because the units are also
**drifting on the wind** and only see the neighbours near them, the pattern is never quite the same
twice — it forms slow, travelling waves of unison rather than a rigid all-at-once strobe. Light is
the only channel: no radio, no coordinator.

## 4. Why it ends in unison (Mirollo–Strogatz)

This "ramp up, flash, reset, and jump when you see a flash" firefly is called a **pulse-coupled
oscillator.** In 1990 Renato Mirollo and Steven Strogatz proved a beautiful result: for a large
class of such oscillators — as long as the bucket fills a little faster when it is nearly empty than
when it is nearly full (a *concave* fill curve) — **almost any starting arrangement ends up fully
synchronised.** Synchrony is not luck; it is where the system inevitably settles.

The intuition is "absorption": once two fireflies happen to flash at the same instant, the rule keeps
them together forever, so they act as one. Little synchronized groups form, then merge with other
groups, until the whole swarm is one group. Our simple *advance-by-ε* nudge is a discrete, hardware-
friendly version of the same idea, and it converges the same way.

## 5. The exact model the sim and firmware use

Both the browser simulator and the unit firmware implement the **identical** rule, so what you watch
on screen is what the hardware aims for.

**Per unit, each has:**
- `phase` ∈ [0, 1) — the water level, starts random.
- `T` — the period in seconds (default ≈ 1–2 s; the simulator's *blink period* control).
- `epsilon` (ε) — the coupling strength, a small positive number (the *coupling strength* control).
- a short **refractory** window right after its own flash, so a unit does not re-trigger on its own light.

**Every time step `dt`:**

```text
# 1. Ramp the phase forward at a steady rate 1/T.
phase = phase + dt / T

# 2. If the bucket is full, flash and reset.
if phase >= 1.0:
    flash()                 # the capacitor-boosted, spark-like pop (spec §5.1)
    phase = 0.0
    start_refractory()

# 3. If we SEE a bright neighbour flash (and we're not refractory),
#    nudge our phase forward by epsilon — never past 1.
on_neighbour_flash_seen():
    if not refractory:
        phase = min(phase + epsilon, 1.0)
        if phase >= 1.0:    # the nudge tipped us over → flash together now
            flash()
            phase = 0.0
            start_refractory()
```

Notes that keep sim and hardware honest:

- **`flash()`** is the capacitor-boosted flash of [§5.1](00-design-spec.md#51-brightness--a-spark-like-flash-without-a-spark):
  dark between flashes, a sharp bright peak — spark-*like*, with **no real spark**. Peak brightness,
  flash duration and colour are parameters; the simulator renders the same sharp profile.
- **Seeing a neighbour** in hardware is the phototransistor crossing a brightness threshold; in the
  simulator it is a neighbour flashing within a visibility radius in the drifting wind field.
- **`epsilon` small** gives gentle, slow synchrony (the pretty case); larger `epsilon` snaps into
  step faster but less softly. Wind and limited sight keep it from ever being a rigid strobe.

This is deliberately the *simplest* rule that synchronises: one phase, one threshold, one nudge. It
matches the Mirollo–Strogatz picture above closely enough that the emergent behaviour is the same,
while being tiny enough to run on an ATtiny-class chip inside a floating unit.

## 6. Things to try in the simulator

Open the [simulator](../../sim/) and experiment — it is the best way to feel the model:

- **Coupling strength ε → 0:** the nudge disappears; flashes stay a random sprinkle forever.
- **Coupling strength up:** watch small synchronized patches form, then merge into swarm-wide waves.
- **Blink period T:** longer T = slower, dreamier waves.
- **More units / stronger wind:** the pattern becomes richer and never repeats, because each unit
  only sees the neighbours the wind brings near it — the riverside feeling.
