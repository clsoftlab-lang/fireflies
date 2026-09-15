# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Dispenser top-level controller — spec 00-design-spec.md section 4.

The *only* live controls (spec stage 5):
  * a start button / handheld remote: "begin releasing",
  * an all-stop: stop releasing immediately.

The controller releases finished fireflies one at a time, on a gentle cadence, from
a magazine of a known count. It never overrides the per-unit safety guards in
``UnitSequence`` (dead-LED or wrongly-buoyant units are rejected, not released).

Pure logic: the clock is injected; each unit's trim/LED results are supplied by the
buoyancy and self-test subsystems (fakes in tests, real hardware on the Pico).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from .sequence import SequenceTimings, State, UnitSequence


@dataclass(frozen=True)
class CadenceParams:
    release_gap_s: float = 3.0     # gentle spacing between releases


class Dispenser:
    """Releases fireflies one at a time on a cadence, with start / all-stop."""

    def __init__(
        self,
        clock: Callable[[], float],
        magazine_count: int,
        cadence: CadenceParams | None = None,
        timings: SequenceTimings | None = None,
    ):
        self.clock = clock
        self.magazine_count = int(magazine_count)
        self.cadence = cadence or CadenceParams()
        self.timings = timings or SequenceTimings()
        self.running = False
        self.released_count = 0
        self.rejected_count = 0
        self.units_started = 0
        self._last_release_at: float | None = None
        self._seq: UnitSequence | None = None
        # injected per-unit results supplier: () -> (trim_ok, led_ok)
        self.evaluate_unit: Callable[[], tuple[bool, bool]] | None = None

    # ---- live controls -------------------------------------------------
    def start(self, now: float | None = None) -> None:
        """Start button: begin releasing."""
        self.running = True

    def all_stop(self) -> None:
        """All-stop: halt releasing immediately. Any in-progress unit is held."""
        self.running = False

    # ---- internals -----------------------------------------------------
    def _begin_unit(self, now: float) -> None:
        self._seq = UnitSequence(self.clock, self.timings)
        self._seq.start(now)
        self.units_started += 1

    def _feed_results(self) -> None:
        """Push trim/LED results into the current sequence when it needs them."""
        if self._seq is None or self.evaluate_unit is None:
            return
        if self._seq.state in (State.FILLING, State.ARMING):
            trim_ok, led_ok = self.evaluate_unit()
            if self._seq.trim_ok is None:
                self._seq.report_trim(trim_ok)
            if self._seq.led_ok is None:
                self._seq.report_led_test(led_ok)

    # ---- main loop -----------------------------------------------------
    def tick(self, now: float | None = None) -> None:
        """Advance the dispenser. Call repeatedly (e.g. every control period)."""
        if now is None:
            now = self.clock()

        # All-stop: never start or release while stopped.
        if not self.running:
            return

        if self.released_count + self.rejected_count >= self.magazine_count and self._seq is None:
            return  # magazine empty

        # start a unit if none in progress and stock remains
        if self._seq is None:
            if self.released_count + self.rejected_count < self.magazine_count:
                self._begin_unit(now)
            else:
                return

        self._feed_results()
        state = self._seq.tick(now)

        if state == State.FAULT:
            self.rejected_count += 1
            self._seq = None
            return

        if state == State.READY:
            # respect the gentle cadence between releases
            if self._last_release_at is None or (now - self._last_release_at) >= self.cadence.release_gap_s:
                if self._seq.command_release(now):
                    self._last_release_at = now

        if state == State.RELEASED:
            self.released_count += 1
            self._seq = None

    @property
    def remaining(self) -> int:
        return self.magazine_count - self.released_count - self.rejected_count
