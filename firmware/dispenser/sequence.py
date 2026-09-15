# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Dispenser per-unit sequence — spec 00-design-spec.md section 4.

State machine for one firefly: LOAD -> FILL to trim -> ARM + LED self-test ->
RELEASE. The safety-critical guarantees (tested):
  * never release a unit whose LED self-test failed (a dead unit, spec stage 3), and
  * never release a wrongly-buoyant unit (not at near-neutral trim, spec stage 2).
A failing unit goes to FAULT and is rejected, not released.

Pure logic: the clock is injected; the buoyancy result and LED-test result are
passed in from their own subsystems, so the whole sequence is host-testable.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum, auto
from typing import Callable


class State(Enum):
    IDLE = auto()
    LOADING = auto()
    FILLING = auto()
    ARMING = auto()      # attach payload + run LED self-test
    READY = auto()       # trimmed and LED-tested OK, waiting for release
    RELEASING = auto()
    RELEASED = auto()
    FAULT = auto()       # rejected: bad trim or dead LED


@dataclass(frozen=True)
class SequenceTimings:
    load_s: float = 2.0
    arm_s: float = 1.0
    release_s: float = 0.8


class UnitSequence:
    """Drives one firefly from magazine to release. Advance with ``tick(now)``."""

    def __init__(self, clock: Callable[[], float], timings: SequenceTimings | None = None):
        self.clock = clock
        self.t = timings or SequenceTimings()
        self.state = State.IDLE
        self._entered_at = 0.0
        self.fault_reason: str | None = None
        # results injected from subsystems:
        self.trim_ok: bool | None = None
        self.led_ok: bool | None = None

    def _enter(self, state: State, now: float) -> None:
        self.state = state
        self._entered_at = now

    def _elapsed(self, now: float) -> float:
        return now - self._entered_at

    def start(self, now: float | None = None) -> None:
        """Begin loading a unit from the magazine."""
        if now is None:
            now = self.clock()
        self.fault_reason = None
        self.trim_ok = None
        self.led_ok = None
        self._enter(State.LOADING, now)

    def report_trim(self, ok: bool) -> None:
        """Buoyancy subsystem reports whether near-neutral trim was reached."""
        self.trim_ok = ok

    def report_led_test(self, ok: bool) -> None:
        """LED self-test result (blink once, photodiode confirms)."""
        self.led_ok = ok

    def _fault(self, reason: str, now: float) -> None:
        self.fault_reason = reason
        self._enter(State.FAULT, now)

    def tick(self, now: float | None = None) -> State:
        """Advance the state machine. Returns the current state."""
        if now is None:
            now = self.clock()
        s = self.state

        if s == State.LOADING:
            if self._elapsed(now) >= self.t.load_s:
                self._enter(State.FILLING, now)

        elif s == State.FILLING:
            # wait for the buoyancy loop to report a result
            if self.trim_ok is False:
                self._fault("buoyancy trim not reached", now)
            elif self.trim_ok is True:
                self._enter(State.ARMING, now)

        elif s == State.ARMING:
            # GUARD: a wrongly-buoyant unit must never proceed even if armed
            if not self.trim_ok:
                self._fault("buoyancy trim not reached", now)
            elif self.led_ok is False:
                self._fault("LED self-test failed (dead unit)", now)
            elif self.led_ok is True and self._elapsed(now) >= self.t.arm_s:
                self._enter(State.READY, now)

        elif s == State.READY:
            pass  # waiting for controller to command release

        elif s == State.RELEASING:
            if self._elapsed(now) >= self.t.release_s:
                self._enter(State.RELEASED, now)

        return self.state

    def can_release(self) -> bool:
        """True only if the unit is READY, trimmed and LED-tested OK."""
        return self.state == State.READY and bool(self.trim_ok) and bool(self.led_ok)

    def command_release(self, now: float | None = None) -> bool:
        """Attempt to release. Refuses (returns False) unless safe to do so."""
        if now is None:
            now = self.clock()
        if not self.can_release():
            return False
        self._enter(State.RELEASING, now)
        return True
