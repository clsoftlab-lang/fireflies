## What does this change?

<!-- A short, plain-language description. Link the issue: "Closes #123". 한국어로 작성하셔도 됩니다. -->

## Why?

<!-- The problem it solves, or the thing it makes prettier / clearer / safer. -->

## Area

- [ ] Simulator (`sim/`)
- [ ] Hardware (`hardware/`: OpenSCAD / STL / wiring / BOM)
- [ ] Firmware (`firmware/`: unit blink+sync or dispenser controller)
- [ ] Documentation (English / Korean)
- [ ] CI / tooling

## Safety impact

<!-- See CONTRIBUTING.md §9 and GOVERNANCE.md §4. When in doubt, choose "safety-relevant". -->

- [ ] **No safety impact.** This cannot change how or when units fly, the flash, buoyancy, helium or
      battery handling, the dispenser's release / all-stop, or the safety guidance.
- [ ] **Safety-relevant.** It touches the sync model, the flash (§5.1), buoyancy trim, the dispenser
      fill / trim / self-test / release / all-stop logic, helium or battery handling, the airspace
      guidance, or the leave-no-trace rules.

If safety-relevant:

- What could go wrong at a real show?
- What did you test (bench, show, or simulator), and what happened?

## Checklist

- [ ] **Spec updated** ([`docs/en/00-design-spec.md`](../docs/en/00-design-spec.md), and the Korean
      [설계서](../docs/ko/00-설계서.md) or help requested), **or** no behaviour / model / safety change.
- [ ] **Tests** pass locally where they apply:
      `node --test sim/tests` · (if present) `pytest firmware/tests` · OpenSCAD renders for changed parts.
- [ ] **Simulator and firmware sync models stay identical** (if either changed).
- [ ] **Documentation** updated (English; Korean updated or help requested).
- [ ] **Accessibility** kept for simulator/doc changes (keyboard, reduced-motion, contrast, alt text,
      no colour-only meaning).
- [ ] **Leave no trace / safety** respected: no ignition source on a flying unit, no "release and walk
      away" mode, default stays indoor/tethered.
- [ ] **Still gentle art:** nothing here moves the project toward any harmful use.
- [ ] **Licences:** any new dependency is Apache-2.0 / MIT / BSD (software) or CC-BY (docs) only.
