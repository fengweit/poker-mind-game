# P2 visual review

## Environment and evidence

- Browser: headless Google Chrome 152 on macOS; loopback `http://127.0.0.1:4173/`.
- Desktop viewport: 1440×900, `actual-p2-desktop.png`.
- Mobile viewport: 390×844 emulation, `actual-p2-mobile.png`; explicitly not physical-device proof.
- Renderer readback: `webgl`; the pinned local Three.js module returned from the same loopback origin.
- Mobile layout: document width 390px in a 390px viewport; Fold/Call/Raise each measured 119×64px.
- Desktop frame sample after a real raise followed immediately by reset: 175 post-warmup rAF intervals, p50 16.7ms, p95 16.8ms, max 16.8ms. This is one local headless-browser sample, not a universal FPS claim.
- Reset readback after 1.2s: pre-flop, pot 30, two hero cards, two opponent cards, result overlay hidden, WebGL active.

## Independent critique boundary

The first implementation was reviewed against a real browser screenshot. Three highest-impact issues were bounded and addressed:

1. The first canvas crossed behind the inspector, creating a false rail arc outside the table. **Fixed:** mount and clip the renderer inside the table.
2. The opaque flat table hid most physical depth. **Fixed:** place WebGL beneath semantic table elements with a restrained transparent wash.
3. Geometry lacked material depth. **Fixed:** add a warm/cool light split, soft shadows, dimensional rail/felt/chips, visible lamp cue, and rain-window plane.

## Remaining visual gaps

- The opponent is still represented by a restrained identity/card silhouette rather than an original modeled character.
- Rain and lamp cues are intentionally subtle; physical mobile-GPU performance remains unmeasured.
- This is a cinematic vertical slice, not a claim of photorealism or equivalence to the reference graphics demo.

Final fixes also made the inspector reachable at 390px and a true 768 CSS-pixel viewport, separated mobile stack labels, collapsed advice by default on desktop, copied the pinned renderer into a deployable same-origin runtime, stopped active pulses when motion turns off, and made the procedural opponent silhouette readable.

Verdict: **P2.1–P2.4 accepted.** Final independent spec gate: PASS. Final independent quality/security gate: APPROVED with no Critical or Important findings. Fresh WebGL, forced fallback, reduced-motion, reset, desktop, mobile and tablet checks reported no captured runtime errors.
