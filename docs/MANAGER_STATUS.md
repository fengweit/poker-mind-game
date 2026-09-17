# THE TELL — Manager status

## Mission
Original cinematic poker game with a cash-revenue validation path. No guaranteed profit; real-money wagering blocked on legal, payment and security gates.

## Current phase
P0.4, P1.1–P1.6 and P2.1–P2.4 are verified. Betting transitions live in `src/betting.js`; cards/evaluation in `src/core.js`; policies remain isolated in `src/ai.js`; and the new presentation-only cinematic renderer lives in `src/scene.js`. P3.1 truthful commercial-plan work is next. The 3D slice is measured browser evidence, not a claim of photorealism or reference-demo equivalence.

The settled result overlay defect is fixed and regression-tested: it now owns a z-index above table/scanlines, uses an opaque backdrop/card, remains inert while hidden, and disables card/table/result motion under OS reduced-motion. P1.6 then exercised the full browser flow on loopback: fold, next hand, keyboard raise, guarded reset, all-in showdown, and mobile-width controls. Reset cancellation uses a hand epoch so old AI waits, runouts, dealer changes and delayed reviews cannot mutate the new hand; reset is disabled before the first deal.

## Verified evidence
- Public repo created: https://github.com/fengweit/poker-mind-game
- Bearer-auth X read succeeded: 99 timeline posts and requested reference metadata/video locally; full method posts retrieved separately.
- `.env` is git-ignored and permission-restricted; public example scrubbed. Tokens appeared in session context, so owner rotation remains recommended.
- Reference sample frames inspected; original cinematic table direction documented.
- Secret-value scan: 3 populated local values, 0 tracked hits, 0 staged hits, and 0 hits across current git history; credential names appear only in blank `.env.example`. `git check-ignore` passed for `.env` and `research/x/reference-video.mp4`; no private path is tracked.
- Historical prototype handoff: 8 tests passed before P1.2/P1.3 expansion. Current full verification is 53/53 tests with `src/scene.js` and `src/game.js` syntax checks passing; `npm audit --omit=dev` reports 0 vulnerabilities.
- Local browser smoke: fold settled 30 virtual chips; a separate check/call line reached a five-card showdown and revealed both hands; mobile 390×844 had no horizontal overflow. Private screenshots: `artifacts/private/browser-smoke/2026-09-16-mobile-fold.png` and `artifacts/private/browser-smoke/2026-09-16-desktop-showdown.png`.
- Independent read-only review inspected the diff, reran tests/checks, and found the code/scope/secret claims safe. Its only initial block was the stale pre-work heartbeat; that status defect was corrected before commit.
- P1.3 RED/GREEN: missing `src/betting.js` produced `ERR_MODULE_NOT_FOUND`; focused tests reached 15/15 and full suite 33/33 after implementation and review fixes. The first independent P1.3 review found illegal all-in raises, AI raise-right failure, and short-blind stalls; the final independent re-review reran tests, exhaustive blind/all-in probes, and browser flows and passed with no blocking logic or security findings.
- P1.3 browser evidence: an actual raise reached flop and showdown; dealer alternated on the next hand; a player-dealer small-blind fold settled the 30-chip pot once and displayed `STACK CHANGE -10` with no captured error/unhandled-rejection. Private screenshot: `artifacts/private/browser-smoke/2026-09-16-p13-fold-delta.png`.
- P1.4 required command completed 10,000/10,000 hands: all 10,000 terminal, chip-conserving, finite-integer and unique-deck; 0 invalid; 3,721 showdowns and 6,279 betting-engine fold settlements. Private ignored artifact: `artifacts/private/simulation.json`, 4,420 bytes, SHA-256 `89978948d33152918226748a5d5fcb2d253ac2705d669c8c65aa846c3fdb916f`.
- The paired 5,000-seed-set replay measured heuristic +62.362 versus random -62.362 virtual chips/hand; paired difference 124.724, SE 5.8086, approximate 95% interval [113.3392, 136.1088]. This is evidence about the fixed simulator and small rule-based policy only—not real opponents, bankroll results, or profit.
- P1.5 tests prove an exact narrow observation API and invariant decisions when unseen cards/runout change; advisor sampling leaves the dealt deck unchanged. Browser and simulator use separate deck, policy, and advisor RNG streams.
- P1.4/P1.5 review: independent spec review passed. Independent quality review first rejected false zero-width uncertainty for one pair; a RED/GREEN repair now returns unavailable uncertainty for that edge. Final re-review approved with no Critical or Important findings. The suite at the P1.5 boundary was 43/43.
- P1.6 loopback acceptance on port 4174: keyboard `F` produced `YOU FOLD` and `STACK CHANGE -10`; next hand dealt 2 hero + 2 opponent cards; keyboard `R` committed a raise; a max-slider all-in ran to five board cards, revealed both hands and settled 2,000/0 with pot 0 in that observed deal.
- Reset during an in-flight opponent turn remained a fresh player-dealer hand after 2.2 seconds: stacks 990/980, pot 30, pre-flop, result hidden, and no captured runtime errors. A separate pre-start check proved reset disabled with zero cards until `TAKE THE SEAT`.
- Chromium mobile emulation at 390×844 reported document width 390 and three enabled action controls about 119×64px each. A 115-frame `requestAnimationFrame` sample measured p50 16.7ms, p95 16.7ms and max 16.8ms; this is emulation, not physical-device evidence.
- Fresh Playwright navigation initially exposed one `favicon.ico` 404; RED/GREEN added an inline icon, after which console capture reported 0 errors and 0 warnings. Private screenshots: `artifacts/private/browser-smoke/2026-09-16-p16-next-hand.png`, `2026-09-16-p16-all-in-showdown.png`, and `2026-09-16-p16-mobile.png`.
- P1.6 review: first spec review caught a stale runout source contract (44/45); the corrected epoch-aware contract restored 45/45. Spec re-review passed. Quality review caught pre-start reset activation; disabled/guarded reset was browser-retested, and final quality/security re-review approved with no Critical, Important, or Minor findings.
- P2 uses pinned `three@0.186.0` and a deterministic `npm run vendor` step to copy both required runtime modules into same-origin `vendor/`; no CDN, external model, paid asset, or reference footage is used. Browser-forced WebGL absence selected the CSS fallback with native controls still playable.
- Real game paths emit deal, committed-chip, board-reveal and showdown presentation events. The renderer has no engine imports or payout API. Reset and motion-off cancel active visual work; a real raise immediately followed by reset returned to pre-flop, pot 30, two cards per seat and a hidden result overlay.
- Final visual evidence: `docs/visual/actual-p2-desktop.png` (Chrome 1440×900) and `docs/visual/actual-p2-mobile.png` (390×844 emulation). Mobile document width equaled viewport width; action controls measured 119×64px. A 175-frame desktop sample measured p50 16.7ms, p95 16.8ms, max 16.8ms. No physical-mobile claim is made.
- Independent review first blocked runtime vendoring, in-flight reduced-motion cancellation, desktop/mobile readability, inspector reachability and silhouette visibility. Those were repaired; final spec recheck passed and final quality/security review approved with no Critical or Important findings.

## Next source of truth
`docs/CHECKLIST.md`, beginning P3.1: define the truthful proposed $9 entertainment-edition revenue validation experiment, actual-versus-projected economics, fulfillment/refund outline, and real-money legal gates. No checkout or revenue claim without verified authorization/payment.

## Durable continuation
Job `f81afb3d50a0` is enabled every 30 minutes for at most 12 runs. At least this scheduled run has completed real implementation/review work; the prior “no run completed” claim was stale. Run outputs are local, with progress committed here. Stop early after accepted launch or external-only blockers.

## Blockers / risks
No verified publishing identity, checkout, gambling licenses or revenue. Owner must rotate X credentials exposed to prior session context. GitHub Pages must stage a public allowlist, not upload the whole repository. Cinematic work, physical-mobile validation, commercial validation, deploy, and launch remain unverified.
