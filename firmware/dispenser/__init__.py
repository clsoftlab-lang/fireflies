# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""Dispenser machine firmware — pure, host-testable logic.

Modules:
  buoyancy    fill-to-near-neutral-trim control loop (spec 4, F2)
  sequence    per-unit state machine: load -> fill -> arm+LED test -> release (spec 4)
  controller  start / all-stop, releases one at a time on a gentle cadence (spec 4)
"""
from .buoyancy import (BuoyancyController, HeliumValve, LoadCell, TrimParams,
                       helium_litres_for_lift)
from .controller import CadenceParams, Dispenser
from .sequence import SequenceTimings, State, UnitSequence

__all__ = [
    "BuoyancyController", "HeliumValve", "LoadCell", "TrimParams",
    "helium_litres_for_lift",
    "SequenceTimings", "State", "UnitSequence",
    "CadenceParams", "Dispenser",
]
