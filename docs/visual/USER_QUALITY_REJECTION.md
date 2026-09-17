# Visual acceptance rejected by user

## Decision
The shipped THE TELL poker prototype does **not** meet the user's requested video-game genre or the Anshu reference's visual bar. Prior P2 checklist approvals and passing tests are superseded for product/visual acceptance. Preserve code as reusable/tested prior work, not as an accepted deliverable. No further promotion or cosmetic poker iteration.

## Direct comparison actually inspected
Reference: https://x.com/anshuc/status/2096008083826725132 — sampled frames from the locally downloaded reference video, inspected through `/tmp/poker-reference-contact.png`.
Delivered: `docs/visual/actual-release-desktop.png`.

Visible differences:
- Reference foreground/midground/background forms a coherent navigable-looking city scene, with streets, facade/window detail, broken masonry, vegetation and distant skyline. Delivered scene is a sparse primitive table/chip/lamp vignette inside a large web interface.
- Reference shows deliberate environmental light/shadow and atmospheric depth; delivered materials are mostly smooth, untextured surfaces and broad dark empty areas.
- Reference character and world are composed together; delivered card controls and labels largely float over decorative geometry rather than embodying actions in a world.
- Reference geometry has recognizable local detail and silhouette variation; delivered rounded rail, cylindrical chips and simple opponent silhouette remain prototype-grade.

These frame observations do not establish actual FPS or animation quality. Those require new real gameplay capture and measured runtime evidence.

## Root cause
Wrong genre interpretation, acceptance of minimum functional milestones as visual quality, and no locked target-image/independent visual-match loop. Image-generation access is currently blocked, but that did not cause or excuse the earlier scope and acceptance mistakes.

## New acceptance gates
- The corrected flight/crash genre must be obvious from a gameplay clip without explanatory text.
- A recognizable original animated flying hero/vehicle, coherent environment, deliberate camera, detailed materials, atmospheric depth and readable minimal UI must carry the presentation.
- Launch, climb, bank/eject and failure must be distinct embodied animations tied to actual game states, not an animated multiplier on a dashboard.
- Use the installed actual Dream Loop, including its target prerequisite and independent composition/lighting/materials/details rubric; show target and actual screenshots side by side.
- Validate visual claims on a 20-second real gameplay capture, not a marketing still. Measure FPS and test inputs separately from the visual judge.
- Do not tick visual acceptance because unit tests pass, a scene has WebGL, or a low-fidelity internal target was met. A judge score measures that particular target only, not equivalence to the user's reference.

Next prerequisite and execution state: `docs/DREAM_LOOP_STATUS.md`. Corrected game brief: `docs/SKYBREAK_PIVOT.md`. No new game implementation or superior visual-quality claim is currently verified.
