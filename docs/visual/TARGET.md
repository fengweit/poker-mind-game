# P2 cinematic target

`TARGET.svg` is an original, hand-authored style frame—not generated concept art and not a frame or asset from Anshu's work. It defines the intended physical hierarchy rather than promising exact final pixels.

## Three screenshot-specific priorities

1. **Depth before decoration.** The prior flat prototype screenshot reads as a single green panel. The target requires a thick elliptical rail, a felt plane receding toward the opponent, dimensional chip stacks, and foreground/background separation.
2. **Warm decision space against cool uncertainty.** The target uses a warm hanging lamp over the table and a cool rain window behind Vesper. Lighting must shape objects; ambient particles cannot substitute for geometry or contrast.
3. **Cards and actions survive the scene.** Hero cards, pot, street, and the three native action buttons must remain the highest-information elements on desktop and at 390px. The renderer is decorative and cannot cover, intercept, or mutate gameplay.

## Critique rubric

- **Composition:** table owns the playable viewport; renderer is clipped to it and does not bleed into the inspector.
- **Physical credibility:** rail, felt, chips, lamp, room/window and lighting show distinct depth/material cues.
- **State truth:** deal, committed-chip, board-reveal and showdown motion originate only from real game events; animations never settle a pot.
- **Readability/accessibility:** native HTML controls remain operable; reduced motion makes effects immediate; CSS fallback keeps the game playable without WebGL.
- **Restraint:** forest/amber/ivory/cool-rain palette; no unlicensed assets, generic neon, or reference footage.

## Evidence

- Desktop actual: `actual-p2-desktop.png` (Chromium, 1440×900).
- Mobile actual: `actual-p2-mobile.png` (Chromium emulation, 390×844; not physical-device evidence).
