# THE TELL — Manager status

## Mission
Original cinematic poker game with a cash-revenue validation path. No guaranteed profit; real-money wagering blocked on legal, payment and security gates.

## Current phase
P0.4 and P1.1–P1.3 are verified. Betting money/action transitions now live in pure `src/betting.js` and are used by the real browser path in `src/game.js`; cards/equity remain in `src/core.js`. P1.3 covers blinds and heads-up order, legal actions and minimum raises, short-all-in no-reopen/refunds, short-blind edge states, runout, payout idempotence, invalid input, and signed whole-hand stack accounting. P1.4 reproducible simulation is next; P1.5 privacy and full P1.6 browser acceptance remain pending.

The settled result overlay defect is fixed and regression-tested: it now owns a z-index above table/scanlines, uses an opaque backdrop/card, remains inert while hidden, and disables card/table/result motion under OS reduced-motion. The motion control truthfully stays OFF and disabled while that preference is active. Final loopback browser proof waited 1.8 seconds after fold: overlay visible at opacity 1/z-index 30, result card top-painted, opaque computed colors, and zero captured JS errors. Private screenshot: `artifacts/private/browser-smoke/2026-09-16-settled-overlay-fixed.png`. This does not complete P1.6: raise/all-in, reset, full showdown repetition, touch controls, and measured performance remain pending.

## Verified evidence
- Public repo created: https://github.com/fengweit/poker-mind-game
- Bearer-auth X read succeeded: 99 timeline posts and requested reference metadata/video locally; full method posts retrieved separately.
- `.env` is git-ignored and permission-restricted; public example scrubbed. Tokens appeared in session context, so owner rotation remains recommended.
- Reference sample frames inspected; original cinematic table direction documented.
- Secret-value scan: 3 populated local values, 0 tracked hits, 0 staged hits, and 0 hits across current git history; credential names appear only in blank `.env.example`. `git check-ignore` passed for `.env` and `research/x/reference-video.mp4`; no private path is tracked.
- Historical prototype handoff: 8 tests passed before P1.2/P1.3 expansion. Current full verification is 33/33 tests with `src/core.js`, `src/betting.js`, and `src/game.js` syntax checks passing.
- Local browser smoke: fold settled 30 virtual chips; a separate check/call line reached a five-card showdown and revealed both hands; mobile 390×844 had no horizontal overflow. Private screenshots: `artifacts/private/browser-smoke/2026-09-16-mobile-fold.png` and `artifacts/private/browser-smoke/2026-09-16-desktop-showdown.png`.
- Independent read-only review inspected the diff, reran tests/checks, and found the code/scope/secret claims safe. Its only initial block was the stale pre-work heartbeat; that status defect was corrected before commit.
- P1.3 RED/GREEN: missing `src/betting.js` produced `ERR_MODULE_NOT_FOUND`; focused tests reached 15/15 and full suite 33/33 after implementation and review fixes. The first independent P1.3 review found illegal all-in raises, AI raise-right failure, and short-blind stalls; the final independent re-review reran tests, exhaustive blind/all-in probes, and browser flows and passed with no blocking logic or security findings.
- P1.3 browser evidence: an actual raise reached flop and showdown; dealer alternated on the next hand; a player-dealer small-blind fold settled the 30-chip pot once and displayed `STACK CHANGE -10` with no captured error/unhandled-rejection. Private screenshot: `artifacts/private/browser-smoke/2026-09-16-p13-fold-delta.png`.

## Next source of truth
`docs/CHECKLIST.md`, beginning P1.4 reproducible 10,000-hand simulation. Keep this replay/test-only and report uncertainty; do not claim live profitability. P1.6 remains unchecked despite the narrower P1.3 browser proof.

## Durable continuation
Job `f81afb3d50a0` is enabled every 30 minutes for at most 12 runs. At least this scheduled run has completed real implementation/review work; the prior “no run completed” claim was stale. Run outputs are local, with progress committed here. Stop early after accepted launch or external-only blockers.

## Blockers / risks
No verified publishing identity, checkout, gambling licenses or revenue. Owner must rotate X credentials exposed to prior session context. GitHub Pages must stage a public allowlist, not upload the whole repository. Simulation, hidden-information proof, full browser acceptance, cinematic work, commercial validation, deploy, and launch remain unverified.
