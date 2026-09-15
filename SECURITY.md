# Security Policy

> Part of Fireflies · CC BY 4.0 · © 2026 CLSOFTLAB, Dr. Lee Il-guk

Fireflies is gentle art, but it still has a safety surface: the dispenser drives a helium valve, and
the units fly. A bug that made the valve behave wrongly, defeated the buoyancy trim or the LED
self-test, or disabled the all-stop could become a *safety* problem. Please report security and
safety-security issues **privately**.

한국어 안내: 보안·안전 취약점은 공개 이슈로 올리지 말고, 아래 GitHub Security Advisories로 비공개 제보해
주십시오. 한국어로 작성하셔도 됩니다.

## How to report

1. Go to this repository on GitHub.
2. Open the **Security** tab.
3. Choose **Report a vulnerability**. This opens a private advisory only you and the maintainers can
   see. (GitHub docs: [Privately reporting a security vulnerability](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability).)

**Do not** open a public issue, pull request or discussion for a vulnerability. You may write in
English or Korean.

Please include:

- What is affected (simulator, firmware, dispenser controller, docs, CI).
- The version (commit `git rev-parse --short HEAD`, or release) and hardware, if relevant.
- Steps to reproduce or a proof of concept.
- What could go wrong, and whether it could affect a real show (people, helium, batteries, flight).

## What to expect

- We aim to acknowledge within **7 days**.
- We keep you informed while we investigate and fix.
- We coordinate disclosure with you; target is a fix within **90 days**, sooner for anything that
  could affect a real show's safety.
- We credit reporters in the advisory unless you prefer to stay anonymous.
- We will not take legal action against good-faith research that follows this policy and avoids harm
  to people, wildlife and privacy.

## In scope

- **Dispenser controller** (`firmware/`): anything that could open the helium valve unexpectedly,
  defeat the buoyancy trim, skip the LED self-test, or disable the start button / all-stop.
- **Firmware** (unit): crashes, hangs, or unsafe power/battery handling.
- **Simulator** (`sim/`): script injection, or unsafe handling of shared links / parameters.
- **CI workflows** in `.github/workflows/`.
- **Supply chain:** unsafe downloads or dependencies in scripts and tooling.

## Out of scope

- Physical attacks on hardware you own.
- Denial of service by radio or physical interference.
- Third-party dependency issues without demonstrated impact here — please report those upstream and
  let us know if we should update.

## Supported versions

Security fixes are made for the latest release and the `main` branch. Please update before reporting,
if you can.
