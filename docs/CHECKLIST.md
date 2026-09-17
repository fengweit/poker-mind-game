# THE TELL — Executable checklist

Source of truth for implementation; do not tick from intention. Existing builder owns prototype code until handoff. Each code slice: add a targeted failing test → run and record genuine failure → minimal fix → run targeted/full suite → review → explicit-files commit. Never fabricate RED output for existing passing code.

## P0 — Safe foundation and reference
- [x] P0.1 Repository created: `fengweit/poker-mind-game`.
- [x] P0.2 Reference post and timeline fetched; relevant long method posts retrieved using `note_tweet`.
- [x] P0.3 Astra plan saved; secrets moved to ignored `.env`; reference research is private/ignored.
- [x] P0.4 Secret scan verified 2026-09-16: 3 local values checked with 0 tracked/staged/history hits; credential names occur only in blank `.env.example`; `.env` and `research/x/reference-video.mp4` are ignored; tracked private-path count is 0. Owner credential rotation remains an explicit owner-only blocker because values entered prior session context.

## P1 — Accept a complete playable prototype
- [x] P1.1 Recovered timeout handoff mapped in `docs/MANAGER_STATUS.md`; `npm test` passed 8/8 and syntax checks passed. Browser smoke additionally proved fold/showdown and exposed a broken mobile inspector toggle, fixed by binding `ui.inspector`; full P1.6 acceptance remains pending. Commit: `docs: record prototype acceptance evidence`.
- [x] P1.2 Ranking edge tests in `test/core.test.js`: wheel loses to six-high; full-house chooses higher trips; quads use kicker; board-only ties; flush ranks lexicographically. Existing evaluator passed all additions immediately, honestly recorded as characterization coverage rather than fabricated RED. Targeted 13/13; full suite 18/18 after the related overlay regression cut. Independent spec and quality reviews passed. Commit: `test: cover poker ranking edges and result accessibility`.
- [x] P1.3 Betting contracts implemented in `src/betting.js`, covered by `test/game.test.js`, and integrated into the actual `src/game.js` path: heads-up blinds/street order, check/call/raise/fold validation, minimum/full raises, short-all-in no-reopen/refunds, short-blind closure, all-in runout, idempotent payout, and pre-mutation numeric rejection. Whole-hand review now preserves blind losses (`-10`, not `-0`). RED was missing module/API; targeted 15/15 and full 33/33 passed after fixes. Initial independent review found three all-in defects; final re-review reproduced the repaired edges and passed with no blocking findings. Browser raise/showdown, alternating dealer, and SB fold produced `STACK CHANGE -10` with zero captured runtime errors. Private screenshot: `artifacts/private/browser-smoke/2026-09-16-p13-fold-delta.png`. Commit: `fix: enforce betting and payout invariants`.
- [ ] P1.4 Create `scripts/simulate.mjs` + `test/simulation.test.js`; run `node scripts/simulate.mjs --hands 10000 --seed 42 --out artifacts/private/simulation.json`. Enumerate and verify requested hands, chip conservation, finite states, unique dealt cards and terminal completion. Compare honest heuristic/random policies on matched seed sets with uncertainty and documented limitations; no live-profit claims. Commit: `test: add reproducible strategy simulation`.
- [ ] P1.5 AI privacy tests in `test/ai.test.js`: replace unseen opponent cards/runout while holding allowed observation and RNG constant, require same decision. Separately perturb advisor samples, require unchanged dealt deck. Commit: `fix: isolate hidden information and random streams`.
- [ ] P1.6 Browser acceptance: serve on loopback (choose unused port); complete fold and showdown, raise/all-in, next hand, reset, keyboard and touch-width controls. Capture evidence and JS console errors. Tests alone cannot tick this. Commit: `test: verify playable poker flows`.

## P2 — Cinematic vertical slice
- [ ] P2.1 Save original style target + critique rubric in `docs/visual/`; identify three visual priorities using real screenshot, not general adjectives. Commit: `docs: define cinematic table target`.
- [ ] P2.2 Implement one real-depth table scene in actual renderer (`src/scene.js` suggested); retain HTML actions. If adding Three.js, pin and self-host via package build. No external model purchases or unlicensed assets. Browser-test loading/fallback. Commit: `feat: add cinematic card-room scene`.
- [ ] P2.3 Bind dealing/chip/reveal effects to actual game events; never let timers settle pots. Test rapid input and reset mid-animation. Add procedural sound opt-in and reduced motion. Commit: `feat: animate real hand events accessibly`.
- [ ] P2.4 Bounded independent visual review, at most three passes. Record viewport/browser, screenshot, frame-time sample and interaction latency in `docs/visual/REVIEW.md`; label emulation. Ensure cards/actions readable at 390px width. Commit: `perf: verify cinematic scene budgets`.

## P3 — Truthful commercial offer and delivery
- [ ] P3.1 Create `docs/COMMERCIAL_PLAN.md` with proposed $9 entertainment edition, fulfillment, cost model, demand test, actual revenue marked unverified, real-money legal gates. No promised returns. Commit: `docs: define revenue validation experiment`.
- [ ] P3.2 Build useful paid-edition content/package before saying available. Add page CTA for verified approved checkout only; otherwise clearly label planned edition and point to feedback, not a fake buy button. Test broken/unset links. Commit: `feat: add honest edition and feedback flow`.
- [ ] P3.3 Verify merchant delivery/account authorization if available; no creation/terms acceptance or financial actions. Record `checkout_blocked` if unavailable. A proposed price or a click is not revenue.

## P4 — Review, deploy and post
- [ ] P4.1 Independent spec and code/security review in `docs/RELEASE_REVIEW.md`; fix critical issues and rerun full tests. No approval by the builder alone. Commit: `docs: record independent release review`.
- [ ] P4.2 Add/test static build allowlist (`scripts/build.mjs`, `test/build.test.js`); only game runtime assets in `dist/`. Assert no `.env`, research, docs with internal data, git metadata or credentials in output. Pages workflow uploads **dist only**, never repository root. Commit: `build: isolate public game artifact`.
- [ ] P4.3 Push explicit verified commits; read remote HEAD. Enable free GitHub Pages where authorized; verify workflow and public URL + nested assets + browser path. Document real URL, not guessed deployment. Commit: `docs: record live deployment proof`.
- [ ] P4.4 Record 15–25 second clip of our actual build; save `artifacts/public/the-tell-launch.mp4` and thumbnail. Inspect frames, confirm original gameplay. No downloaded reference footage in promotional material. Commit: `docs: prepare verified launch media`.
- [ ] P4.5 Verify X account identity and existing ledger; publish at most one honest launch post linking live game, attach our clip if supported. Read exact post back and record ID/URL/text in `docs/LAUNCH_STATUS.md`. If auth wall, save draft and record blocker, not success.
- [ ] P4.6 Final report: playable URL, repo commit, tests/review/performance, X URL or blocker, checkout/revenue status. Pause remaining scheduler runs when complete or all remaining tasks need account/legal action.

## Every autonomous run
1. Read this checklist and manager state; acquire exclusive local lock and defer if another writer owns it.
2. Work one small verifiable acceptance slice or a tightly related group; don't redo finished steps.
3. Update heartbeat before and after work; record evidence/blockers and next step.
4. Commit explicit safe files; push after tests and read remote commit back. Keep private evidence out of public git.
5. Release lock. One failed lane must not block unrelated tests/visuals/docs. No questions or invented proof.
