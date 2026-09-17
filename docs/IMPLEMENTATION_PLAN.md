# THE TELL — Astra Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Ship an original cinematic browser poker game, measure whether people enjoy and will pay for it, and pursue cash revenue without pretending a prototype is a profitable or licensed gambling business.

**Architecture:** Keep a deterministic, renderer-independent poker engine beneath a cinematic scene and a semantic HTML control layer. Ship a static playable demo first; use a staged build output so local research and credentials never reach GitHub Pages. A paid entertainment edition and a licensed real-money operation are separate products with different release gates.

**Tech stack:** Existing ES modules and Node built-in tests; procedural Canvas prototype followed by a narrowly scoped Three.js/WebGL scene if it materially improves the reference fit; static deployment on GitHub Pages. No paid APIs, ads, purchases, or new financial-account setup.

## Ownership and current truth

This plan is authored in the active GPT-6 Astra chat. The already-running prototype builder is `gpt-5.6-sol`; do not call that an Astra build. Prototype files observed: `src/core.js`, `test/core.test.js`, `package.json`. Only repository initialization is currently verified. The builder may still be editing; avoid parallel edits to its files until its commit/handoff arrives.

Execute `docs/CHECKLIST.md` in order. Completion requires evidence, not elapsed overnight time. Maintain `docs/MANAGER_STATUS.md` and `docs/AGENT_HEARTBEAT.md` every scheduled run. Stop remaining runs when launch acceptance passes or only account/legal blockers remain.

## Product thesis: poker is interesting because decisions survive uncertainty

Working name: **THE TELL**. Hook: **“Read the player. Not just the cards.”**

A rain-soaked, after-hours card room. One table, one opponent with a learnable style, short heads-up matches. A quiet room becomes tense as the pot grows; a showdown ends the tension. The player can win with a good hand, induce a fold, or correctly walk away. Actual decisions, not a slot-machine skin.

Core loop: deal → observe opponent/action history → choose a legal action → reveal next street → showdown/fold → concise decision review → next hand or leave. Separate outcome from decision quality: a good call can lose, a bad call can win. AI personalities change ranges and aggression, never secretly change dealt cards.

Why poker attracts people (design hypotheses, not new experimental findings): uncertain outcomes, meaningful agency, social inference, skill mastery, competition, and variable rewards. Teach the risks too: loss chasing, outcome bias, and near-miss misinterpretation. Never rig near misses, obscure losses, sell chip refills, or add pressure countdowns, autoplay, loss-chasing offers, cash-out illusions, or manipulative streak rewards.

## What the reference actually says

Sources:
- Original: https://x.com/anshuc/status/2096008083826725132
- Method: https://x.com/anshuc/status/2096008086901113339
- Graphics-demo scope clarification: https://x.com/anshuc/status/2096170387126042973
- Later workflow: https://x.com/anshuc/status/2097821164093480999
- Published workflow: https://github.com/achimala/dream-loop

Local API evidence is in ignored `research/x/`; the first timeline extraction truncated long tweets. `method-posts-full.json` contains fetched `note_tweet.text` for the relevant methodology posts. Do not treat short timeline text as full-thread coverage.

The original approach uses target concept images and repeated comparison against actual in-game screenshots. Later posts emphasize procedural assets and narrow work packets to control cost. The author explicitly distinguishes a graphics demo from a full game. His timing/cost/performance claims are his reports, not our benchmark.

Inspected video sample frames show an oblique/isometric, physically lit ruined city diorama, layered block geometry, atmospheric distance and restrained dark HUD. We borrow scene depth, material contrast and world motion—not the city, characters, assets, branding or footage. The initial Canvas poker prototype is an interaction spike, not proof of equivalent 3D quality.

## Visual target and critique loop

Primary surface: **Operate / play**, not a marketing dashboard. The table owns the viewport; advice is collapsed until requested. Large readable cards, tactile chips, sparse type, no wall of metric cards.

One hero scene: dark green felt, worn brass rail, warm hanging lamp, cool rain-lit window, a silhouetted opponent. Procedural geometry/textures; self-host any small licensed engine dependency. Use depth and lighting before decorative particles. Palette is restrained forest/amber/ivory with danger red; no indiscriminate neon or gratuitous scanlines.

Order: readable composition → credible materials/light → card/chip motion → environmental rain/dust → optional modest postprocessing. Sound only after a user gesture. Reduced-motion mode disables shake, pulsing and dramatic camera transitions.

Store our own target board and screenshots under `docs/visual/`. If no configured image-generation capability exists, use an original rendered style frame and label it honestly; do not claim an AI concept-art generation step occurred. Compare desktop and mobile screenshots after each visual cut. Critic reports must identify the largest visible gap, not vaguely ask for more polish. At most three polish passes before shipping the first tested slice.

Performance targets are goals until measured: smooth 60fps desktop, playable 30fps mobile, no repeated main-thread equity calculation each frame. Record device/browser/viewport and p50/p95 frame times. Use a worker or cached bounded sample calculations; cap pixel ratio and particles. Missing real mobile hardware means mobile emulation only, explicitly labeled.

## Game correctness contracts

- Canonical deck: exactly 52 unique cards; seeded RNG only for tests/replays; one immutable dealt order per hand.
- Five-card ranking and best-five-of-seven; wheel straight, kickers, board ties and all categories.
- State machine: blinds, preflop/flop/turn/river, terminal payout; legal action validation before mutation.
- Correct heads-up dealer/small-blind and action order; minimum raise rules; short all-ins must not incorrectly reopen betting.
- Chip conservation including bets/pot; no negative or nonfinite values; refund unmatched heads-up contributions; pay a terminal hand exactly once.
- AI receives only its hole cards, public board and observable actions. Never pass the hero cards/deck/runout into its policy.
- Advisor sees only hero cards/public information and a stated opponent-range model. Report sampled equity as an estimate, not a solver guarantee. Keep its RNG independent from deck RNG.
- Durable replay logs contain decisions and seed only in local test tooling; do not leak hidden cards through the visible inspector.

Use existing `src/core.js` contracts where possible (`createDeck`, `shuffle`, `evaluate`, `bestOfSeven`, `compareHands`, `estimateEquity`). Put engine transitions in `src/game.js`, policy in `src/ai.js`, and rendering in `src/scene.js` when separation becomes useful. If prototype uses other names, record a mapping instead of duplicating logic.

## Revenue strategy: prove the offer before adding a backend

The user wants cash earnings, not just a toy. Revenue is a hypothesis until an actual completed payment is observed. Profit additionally requires attributable costs and refund/fee accounting. Zero invented sales, customers, testimonials or conversion statistics.

Fast legal-independent experiment: free browser demo plus a **proposed $9 one-time entertainment edition** with extra opponent challenges/rooms and offline play. Price is a test choice, not validated demand. Deliver the paid content before offering it for immediate purchase; otherwise label it as planned and collect interest only. Virtual chips have no purchase, transfer, cash value or redemption. No loot boxes or paid tournaments.

Create `docs/COMMERCIAL_PLAN.md` with audience, offer, delivery, support/refund outline, unit-economics formula and explicit actual-vs-projected columns. Existing approved merchant/storefront access can be inspected for feasibility without exposing secrets. No new bank/payment account, financial terms acceptance, payment transfers, paid marketing or false checkout. If an approved checkout cannot be verified, record `checkout_blocked` and still ship the free game and launch assets. Do not imply the paid product is available.

A real-money poker operation is **gated, not implemented**: eligible operating jurisdiction and legal review, operator/vendor licenses, payment/acquirer approval, age/KYC/AML, geofencing, responsible-gambling controls/self-exclusion, certified RNG/fairness, anti-collusion, secure server authority, audited ledger/funds custody, tax/reporting and support. Static GitHub Pages/client-side cards cannot safely host money games. No deposits, real-money bets, cash-outs, rake or gambling referrals until these gates are resolved.

## Launch and distribution

Produce a short capture of our real gameplay, not Anshu's clip, fake video or a concept mockup pretending to run. Publish the verified static demo. Post one truthful X launch announcement from the verified logged-in user account, only after live URL and features pass browser checks. The user has authorized public posting, but not spam. No automatic follow, DM campaign or engagement manipulation. Keep a local posting ledger; read back exact post ID/text/media to prevent duplicates and false success.

The supplied app bearer token can read posts; it is not user-authorized publishing access. Consumer key + secret do not by themselves complete OAuth user authorization. Browser publishing is a fallback only if an actual usable session and account identity are verified. A loading shell is not sufficient proof of login. On login/permission/payment wall, record the blocker and continue independent work without asking the sleeping user or bypassing controls.

## Acceptance and stop conditions

A first release needs automated rules tests, seeded simulation, independently reviewed hidden-information boundaries, browser playthrough (fold and showdown), desktop/mobile screenshots, error-free console on tested paths, measured performance, secret-safe build, remote commit verification and public URL readback. A screenshot alone is not gameplay QA.

Commercial readiness and real-money legality remain separate statuses. Stop on auth/legal/payment barriers for the dependent lane; don't call them engineering success. Keep polishing bounded. No overnight scheduler has been verified merely because this plan exists.
