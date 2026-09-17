# SKYBREAK — video-game pivot

> For Hermes: execute this focused visual/gameplay slice; old poker completion is not completion of the user's request.

## User correction — controlling requirement
The user explicitly rejected the poker product: “what i really want build is not poker, but a video game! this is not good enough!” They supplied OLG FlyX Cash Turbo as the new concrete reference. Do not build further poker features, poker education, poker HUDs, or cosmetic poker reskins. Do not let prior accepted poker checklists override this correction. No questions are needed.

## Reference evidence and limits
Public source: https://www.olg.ca/en/casino/play-flyx-cash-turbo.html
The parent opened the supplied full URL and read the OLG product page. It describes a crash betting game with one or more bets, rising multipliers and cash-out before the hero flies away. The promo art visibly uses an orange flying hero/rocket against purple clouds. The page advertises 97.0% RTP and a turbo feature; those belong to OLG's game, not ours. We have NOT inspected the actual embedded gameplay: Play Demo navigated to #/demo but its provider iframe failed to render (grey broken-frame screen). Do not claim a played demo, copy its mathematics, or infer exact turbo implementation. Do not bypass authentication, age or location restrictions.

The earlier Anshu reference establishes ambition for cinematic, lively browser game graphics. Borrow procedural lighting, visual depth and screenshot iteration, not any source assets, brand, characters or code.

## Product: SKYBREAK (working original title)
**Surface: play/operate. The animated world fills the screen.** A small expressive courier craft takes off from a floating launch platform into a layered cloud canyon. Speed and altitude increase while the multiplier rises. The player's one consequential action is **BANK / EJECT** before the randomized flight ends. Ejection visibly launches an escape capsule back toward safety; holding too long ends in a spectacular but non-flashing energy breakup. Result shows the actual settled virtual-credit outcome and a manual next-flight button.

Bright, readable cinematic scene: coral craft, warm sun and sky-blue/teal atmosphere, volumetric-looking cloud banks, parallax islands, water/sky horizon, strong shadows and bloom-like engine trail. Camera follows flight with restrained banking. A recognizable animated craft and moving world are non-negotiable. No line graph as the main game, no decorative dashboard, no card table, no metrics-card wall.

Use procedural Three.js geometry/materials, existing pinned self-hosted vendor dependency if helpful. Keep controls as native HTML. Canvas2D fallback can stay playable but don't market fallback as 3D. No paid assets, external models or external image service calls.

## Tight MVP scope
- One complete launch → climb → bank OR crash → result → manual replay loop, not a splash screen.
- Virtual-credit balance and stake selector; two huge controls (LAUNCH and BANK) with space-key support and accessible labels. Clear 18+ / virtual credits / no purchases or cash redemption disclosure.
- Big readable live multiplier and stake/potential return; compact recent-round history generated only by actual plays. No fake players, leaderboard, social proof, fabricated streaks or fake money.
- One real animated craft, three or more depth layers, engine plume/particles, meaningful launch/eject/crash animations, procedural opt-in sound and reduced-motion mode.
- No autoplay, purchased chips, loss-chasing offers or suggestions that recent results predict the next crash. Future crash time is sampled once before launch and never retuned by user behavior or bank timing.
- Render and sound never decide balances. Pure deterministic state machine handles integer virtual-credit settlement once, invalid stakes, crash/bank ordering and repeated input. Use monotonic elapsed time, define boundary ties in favor of crash, and keep rendering RNG separate from game outcome RNG.
- Transparent rules: prototype random-outcome flight, not a claim of skill or profitable betting. Do not copy OLG's RTP claim; document the actual simplified distribution implemented.
- Visibility-change/reset policy explicitly prevents background-tab timer exploits; reset cannot restore already-lost credits while keeping winnings. Free fresh-session reset is labeled accurately.

## Files and preservation
Create additive `skybreak/index.html`, `skybreak/styles.css`, `skybreak/engine.js`, `skybreak/scene.js`, `skybreak/game.js`; tests under `test/skybreak*.test.js`. Preserve existing poker source and deployed root; it is prior work, not the new deliverable. Add only these explicit new files to the public allowlist so `/skybreak/` deploys independently. Don't copy .env or research; don't edit prior X post or post another announcement yet. New public demo should be shown to the user before new promotion.

## Fast execution order / acceptance
1. Write focused pure-engine tests and implement launch, bank/crash, exactly-once accounting, invalid/rapid inputs and stale-round cancellation. Record actual test results, not an invented RED.
2. In the SAME run, implement the actual flight scene and complete controls. Do not spend a run on only plans or backend abstractions. Original game visible in first screenshot is the priority.
3. Browser-test one bank and one crash using explicit test-only fixtures without rigging normal play. Exercise mobile viewport, keyboard, reset and motion-off; inspect screenshots of real mid-flight and results, plus console and network errors.
4. Independent critic checks “does this visibly look/play like an animated flight game rather than a poker UI or dashboard?” Fix its largest concrete visual/interaction gap. At most two polish rounds before showing the playable first slice.
5. Tests + allowlist + no-secret scan; explicit-files commit/push and read remote SHA. Verify Pages /skybreak/ actual launch/bank/crash, record screenshots and measured performance. Never claim smoothness solely from unit tests.
6. Save `docs/SKYBREAK_STATUS.md` with evidence, actual URL, remaining gaps. No revenue guarantee or cash operation claim. Pause after the first credible playable preview rather than cycling through business docs.

## Commercial boundary
User wants cash revenue, and this is still unachieved. This build is a virtual-credit game prototype, not a merchant system or licensed gambling operator. Real deposits/wagers/cash-outs require separate legal, jurisdiction, payment and server-authoritative security approvals. Do not silently substitute a $9 poker product as if it satisfies the corrected request.
