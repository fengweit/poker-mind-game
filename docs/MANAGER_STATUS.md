# THE TELL — Manager status

## Mission
Original cinematic poker game with a cash-revenue validation path. No guaranteed profit; real-money wagering blocked on legal, payment and security gates.

## Current phase
P0.4, P1.1, and P1.2 are verified. The recovered prototype remains renderer/browser-coupled in `src/game.js`; deterministic hand primitives and equity live in `src/core.js`. P1.2 added explicit wheel, dual-trips full-house, quads-kicker, board-tie, and full flush-lexicographic coverage. The existing evaluator passed those additions immediately, so this is characterization evidence, not fabricated RED.

The settled result overlay defect is fixed and regression-tested: it now owns a z-index above table/scanlines, uses an opaque backdrop/card, remains inert while hidden, and disables card/table/result motion under OS reduced-motion. The motion control truthfully stays OFF and disabled while that preference is active. Final loopback browser proof waited 1.8 seconds after fold: overlay visible at opacity 1/z-index 30, result card top-painted, opaque computed colors, and zero captured JS errors. Private screenshot: `artifacts/private/browser-smoke/2026-09-16-settled-overlay-fixed.png`. This does not complete P1.6: raise/all-in, reset, full showdown repetition, touch controls, and measured performance remain pending.

## Verified evidence
- Public repo created: https://github.com/fengweit/poker-mind-game
- Bearer-auth X read succeeded: 99 timeline posts and requested reference metadata/video locally; full method posts retrieved separately.
- `.env` is git-ignored and permission-restricted; public example scrubbed. Tokens appeared in session context, so owner rotation remains recommended.
- Reference sample frames inspected; original cinematic table direction documented.
- Secret-value scan: 3 populated local values, 0 tracked hits, 0 staged hits, and 0 hits across current git history; credential names appear only in blank `.env.example`. `git check-ignore` passed for `.env` and `research/x/reference-video.mp4`; no private path is tracked.
- Core verification: 8 tests passed, 0 failed; both JavaScript source files passed syntax checks.
- Local browser smoke: fold settled 30 virtual chips; a separate check/call line reached a five-card showdown and revealed both hands; mobile 390×844 had no horizontal overflow. Private screenshots: `artifacts/private/browser-smoke/2026-09-16-mobile-fold.png` and `artifacts/private/browser-smoke/2026-09-16-desktop-showdown.png`.
- Independent read-only review inspected the diff, reran tests/checks, and found the code/scope/secret claims safe. Its only initial block was the stale pre-work heartbeat; that status defect was corrected before commit.

## Next source of truth
`docs/CHECKLIST.md`, beginning P1.3. A read-only architecture cut found one bounded path: extract a pure `src/betting.js`, test it in `test/game.test.js`, and integrate only betting transitions into the actual `src/game.js` path. Keep cards, AI, rendering, and review UI out of that extraction. Do not mark P1.6 from current smoke alone.

## Durable continuation
Job `f81afb3d50a0` is enabled every 30 minutes for at most 12 runs. At least this scheduled run has completed real implementation/review work; the prior “no run completed” claim was stale. Run outputs are local, with progress committed here. Stop early after accepted launch or external-only blockers.

## Blockers / risks
No verified publishing identity, checkout, gambling licenses or revenue. Owner must rotate X credentials exposed to prior session context. P1.3 remains a correctness risk: current browser-coupled betting silently clamps invalid amounts, conflates check/call, mishandles some short all-ins/refunds, and can use the next hand's dealer for postflop order. GitHub Pages must stage a public allowlist, not upload the whole repository.
