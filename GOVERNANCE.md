# Governance

> Part of Fireflies · CC BY 4.0 · © 2026 CLSOFTLAB, Dr. Lee Il-guk

This document explains who decides what, and how. It is deliberately simple and will grow with the
community.

한국어 요약: 프로젝트 책임자는 씨엘소프트랩(CLSOFTLAB) 이일국 박사입니다. 보통의 변경은 메인테이너
검토로 결정하고, 안전·비행·설계서에 영향을 주는 변경은 두 명의 승인과 근거가 필요합니다. 학생 기여자를
환영하고 그들의 의견을 존중합니다.

## Contents

1. [Principles](#1-principles)
2. [Roles](#2-roles)
3. [Ordinary decisions](#3-ordinary-decisions)
4. [Safety- and spec-critical decisions](#4-safety--and-spec-critical-decisions)
5. [Releases](#5-releases)
6. [Becoming a maintainer](#6-becoming-a-maintainer)
7. [Changing this document](#7-changing-this-document)

## 1. Principles

- **It stays gentle art.** Safe, non-harmful, leave-no-trace — always.
- **Safety over spectacle, evidence over opinion.** Indoor/tethered is the default; leave no trace.
- **The spec is the contract.** Behaviour changes start as changes to
  [`docs/en/00-design-spec.md`](docs/en/00-design-spec.md).
- **Open by default.** Decisions and their reasons live in public issues and pull requests, except
  security and conduct matters.
- **Welcoming, including to students.** New and young contributors are part of how this project works.

## 2. Roles

### Project lead

**Dr. Lee Il-guk (이일국), CLSOFTLAB (씨엘소프트랩)** — founder and lead.

- Sets the mission and long-term direction.
- Appoints and removes maintainers.
- Has the final say, used sparingly, especially on safety and on keeping the project gentle.

### Maintainers

- Review and merge pull requests, triage issues, and keep the simulator, hardware, firmware and docs
  coherent with the spec.
- Uphold the Code of Conduct and this document.

### Contributors

Anyone who opens an issue or pull request, builds a unit, files a show report, or improves the docs.
This includes students and first-timers, who are explicitly welcome.

## 3. Ordinary decisions

Most changes — simulator visuals, docs, refactors, non-safety fixes — need **one maintainer's
approval** on a pull request, with CI passing. Disagreements are resolved by discussion; if needed,
the project lead decides.

## 4. Safety- and spec-critical decisions

A change is safety- or spec-critical if it touches:

- the sync model, the flash (§5.1), buoyancy trim, or the dispenser's fill / trim / self-test /
  release / all-stop logic;
- the safety and airspace guidance, or the leave-no-trace rules;
- helium or battery handling;
- the design spec's behaviour (English **and** the Korean 설계서).

These need **two approvals, including one maintainer**, plus evidence (test results, a bench or show
report, or a clear argument). The spec is updated in the same change. When in doubt, treat a change as
safety-critical.

## 5. Releases

- Releases are tagged from `main` with CI green.
- Each release notes what changed, and flags any safety- or spec-affecting change.
- Security fixes may be released out of the normal cadence.

## 6. Becoming a maintainer

Maintainers are invited by the project lead after a track record of good, kind contributions and sound
judgement on safety. Say if you would like to help more — we are glad to grow the team, students
included.

## 7. Changing this document

Propose changes by pull request. Changes to governance need the project lead's approval and are
announced openly.
