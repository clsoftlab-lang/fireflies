# Contributing

> Part of Fireflies · CC BY 4.0 · © 2026 CLSOFTLAB, Dr. Lee Il-guk

Thank you for helping make a sky full of drifting light. Fireflies is gentle, open art, and it gets
better with people from many places, ages and skill levels.

**Students and young makers are especially welcome** — two of this project's contributors are a
high-school and a middle-school student. If any part of contributing feels confusing or out of reach,
that is our bug to fix: [open an issue](https://github.com/clsoftlab-lang/fireflies/issues) and ask.

한국어 안내: 이슈와 풀 리퀘스트는 영어가 기본이지만 **한국어도 환영합니다.** 영어가 어려우면 한국어로
쓰셔도 됩니다. 학생과 젊은 메이커를 특히 환영합니다.

## Contents

1. [Ground rules](#1-ground-rules)
2. [Ways to contribute](#2-ways-to-contribute)
3. [Issues](#3-issues)
4. [Pull requests](#4-pull-requests)
5. [Simulator](#5-simulator)
6. [Hardware](#6-hardware)
7. [Firmware](#7-firmware)
8. [Documentation & translations](#8-documentation--translations)
9. [Safety reviews](#9-safety-reviews)
10. [Licences of contributions](#10-licences-of-contributions)

## 1. Ground rules

- Be kind. Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- **The spec comes first.** [`docs/en/00-design-spec.md`](docs/en/00-design-spec.md) is the single
  source of truth. If your change affects behaviour — the sync model, the flash, buoyancy, the
  dispenser stages, safety modes — change the spec in the same pull request (or first), then the
  implementation. Keep the Korean [설계서](docs/ko/00-설계서.md) in step, or ask for help doing so.
- **This is art, and it stays art.** Fireflies is gentle, safe, leave-no-trace art; contributions
  that push it toward any harmful use will not be accepted.
- **Safety is not optional** (spec §6). The default is indoor/tethered; free-release is advanced and
  permit-required. Never propose a "release and walk away" mode (spec §7).
- **Permissive licences only:** Apache-2.0, MIT, BSD for software; CERN-OHL-P for hardware; CC-BY for
  docs. No copyleft or unclear-licence dependencies.

## 2. Ways to contribute

You do not have to write code. All of these help:

- Improve the [simulator](sim/) (visuals, controls, accessibility, performance).
- Build a real unit or dispenser and file an honest [show report](.github/ISSUE_TEMPLATE/show-report.yml).
- Improve the docs, or translate them (the Korean design spec is done; guides 01–05 are open).
- Report a bug, suggest an idea, or file a [safety note](.github/ISSUE_TEMPLATE/safety-note.yml).

## 3. Issues

- Search first, then use a template: **bug**, **feature / idea**, **show report**, or **safety note**.
- **Security vulnerabilities** do not go in public issues — see [SECURITY.md](SECURITY.md).
- Remove personal information (faces, exact locations, phone numbers) from anything you attach.
- Korean is welcome.

## 4. Pull requests

1. Fork, branch, and make a focused change.
2. Run the checks locally (see below) and fill in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md).
3. Link the issue ("Closes #123"), describe what and why, and note any safety impact.
4. A maintainer reviews. Safety- or spec-touching changes get extra review (see
   [GOVERNANCE.md](GOVERNANCE.md)).

## 5. Simulator

The simulator is plain HTML/CSS/JS with **no build step**. Open [`sim/index.html`](sim/index.html) in
a browser to try it. Run the tests (Node.js 20+):

```bash
node --test sim/tests
```

Keep it accessible (keyboard, reduced-motion, high-contrast), responsive, and light/dark aware
(spec §8). If you change the sync model, change the spec and match the firmware.

## 6. Hardware

Hardware lives in `hardware/` (OpenSCAD sources, STL, wiring, BOM), licensed CERN-OHL-P-2.0.

- Re-render and commit the STL for any `.scad` you change.
- Keep every flying part inside the buoyancy budget and the leave-no-trace materials list
  ([04 · Leave no trace](docs/en/04-leave-no-trace.md)).
- Document helium and battery handling; never add an ignition source to a flying unit (spec §5.1).

## 7. Firmware

Firmware lives in `firmware/` (Apache-2.0). It implements the **exact** pulse-coupled sync model of
[05 · Synchrony explained](docs/en/05-synchrony-explained.md). If firmware tests are present, run:

```bash
pip install pytest numpy pyyaml
pytest firmware/tests
```

Keep the simulator and firmware models identical — that is the whole promise of the project.

## 8. Documentation & translations

- English is the base; the Korean **[설계서](docs/ko/00-설계서.md)** is a complete translation and the
  Korean source of truth.
- Translations of guides 01–05 into `docs/ko/` (local file names like `01-제작가이드.md`) and other
  languages under `docs/<lang>/` are very welcome.
- Use real headings, meaningful link text, and describe diagrams in words. Do not rely on colour alone.
- Every doc starts with the line: `> Part of Fireflies · CC BY 4.0 · © 2026 CLSOFTLAB, Dr. Lee Il-guk`.

## 9. Safety reviews

Any change that touches how or when units fly, the flash, helium/battery handling, or the airspace
guidance is **safety-relevant**. Say so in your pull request, explain what could go wrong, and expect
a second reviewer. When in doubt, choose "safety-relevant".

## 10. Licences of contributions

By contributing you agree your contribution is licensed under this repository's licences: Apache-2.0
(software), CERN-OHL-P-2.0 (hardware), CC BY 4.0 (documentation). Only add third-party material under
compatible permissive licences.
