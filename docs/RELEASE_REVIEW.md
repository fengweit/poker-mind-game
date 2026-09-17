# THE TELL — independent release review

Reviewed: 2026-09-17 EDT
Scope: commercial disclosure, visual fixes, static public artifact, Pages workflow, gameplay/runtime regression and release security.

## Verdict

**APPROVED** after one required repair cycle. The initial quality/security review required Pages deployment credentials to be removed from the dependency-install/build job. The workflow now grants `pages: write` and `id-token: write` only to `deploy`; all Actions are pinned to verified commit SHAs. The same review's minor hardening requests were also completed: destination symlinks are rejected, artifact tests independently prohibit private/internal path classes, and the feedback disclosure/link has contract coverage.

The independent spec review passed: the settled desktop scene has two hero cards after animations, visible physical felt/rail/lamp, readable status copy and a deliberately styled inspector control; the proposed edition is explicitly not for sale; the allowlist contains only runtime files; and the workflow uploads `dist` only. No real-money, checkout, payment or revenue functionality was added.

## Reproduced verification

- `npm test`: 60 passed, 0 failed.
- `npm run build`: 11 explicit allowlisted runtime files.
- `git diff --check`: passed.
- Independent artifact scans: no `.env`, `.git`, `research`, `docs`, `artifacts`, `node_modules`, credentials or internal-status markers in `dist/`.
- Browser against `dist/`: WebGL renderer active, two hero cards after settle, self-hosted Three.js loaded, 0 captured errors/unhandled rejections.
- 180-frame desktop sample: p50 16.7 ms, p95 16.7 ms, max 16.8 ms.
- Mobile emulation 390×844: document width 390; three action controls 119×64 px; two hero cards after settle. Physical mobile remains unverified.

## Visual evidence

- `docs/visual/actual-release-desktop.png` — Chrome 1440×900, settled deal.
- `docs/visual/actual-release-mobile.png` — Chrome mobile emulation 390×844, settled deal.

These screenshots are original runtime output and contain no downloaded reference footage.
