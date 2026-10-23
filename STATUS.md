# Status: paused 2026-10-23 ~11:15 by the user, mid round 2

## Done
- The plan is traced into `src/plan.js` at 28.2 px/ft. That scale checks out against 7 labelled rooms. The
  file holds 33 rooms, ~140 walls, ~55 doors and windows, plus fixture marks.
- The engine works: shell (walls, openings, floors, ceilings, trays, vault, baseboards, door and window units),
  lighting presets, GTAO/bloom post, walk mode with collision (60 fps on the bare shell) and headless screenshots
  (`tools/shot.mjs`, GPU via Vulkan).
- `BUILDERS.md` is the brief every builder works from.
- All four pieces are built out (the 2026-10-22 notes undersold this):
  - exterior: house massing, roof, cladding, openings, site and vegetation all match the photo's layout
  - great_room: kitchen, living, dining, beams and lights
  - master_suite: bedroom, bath and tray ceiling
  - rest: all 11 views, furnished

## Critic loop
| piece | photo | round 1 (baseline) | round 2 |
|---|---|---|---|
| exterior | refs/front_view.webp | photo won: flat lighting, no shadows under overhangs | builder stopped early, nothing changed yet |
| great_room | refs/inside_view_1.webp | photo won: flat grey floor with no planks or rug | done (`shots/great_room/round_2.png`); photo won: clay-like sectional cushions, flat light |
| master_suite | refs/inside_view_2.webp | photo won: exterior roof pokes through the ceiling (exterior's), weak contact shadows | done (`shots/master_suite/round_2.png`); critic waits on the exterior's ridge-cap fix |
| rest | none | n/a (QA and polish only) | builder stopped early, nothing changed yet |

The full critiques are in `critiques/LOG.md`. Blind pairs are built with random A/B order at the photo's size,
as PNGs with metadata stripped, and each critic reads only those two files.

## Next steps (in order)
1. Exterior builder, round 2: first fix `house:ext.ridgecap`, which hangs into `mstr` at X≈-8.5, Y≈3.1, Z≈-6.7, below
   the 11 ft tray ceiling. Then the round-1 critique in LOG.md (flat lighting first).
2. Then the master critic, round 2 (full scene, blind pair).
3. Great room builder, round 3: the round-2 critique in LOG.md. Also re-check the living-group layout: our sectional is too
   close to the camera and the coffee table sits left of where the photo has it.
4. Rest builder: the QA and polish pass (the prompt said: shoot every view, fix defects, then raise the weakest 2 or 3).
5. Engine (mine): GTAO's blend does `mix(1, ao, intensity)`, which extrapolates when `aoIntensity` > 1 (the great room uses
   1.25). Switch the blend to `pow(ao, intensity)` above 1, or clamp to 1. The master builder saw a blue tint when over-driven.

## To resume
1. `npm install` (node_modules is untracked now), then `npm start` and open http://localhost:8080
   (WASD walk, 1-9 views, L lighting, O AO).
2. Builders: fresh agents with BUILDERS.md plus the last critique. They finish with `shots/<piece>/round_<N>.png`.
3. Critics: a fresh agent per photo piece, with a blind A/B. Log every round in `critiques/LOG.md`.

## Notes
- Vercel: three.js is vendored in vendor/three/ (Vercel never serves node_modules). `npm run vendor` refreshes it.
- tools/serve.mjs now sends Content-Length. Without it, Chromium reported spurious `net::ERR_ABORTED` on glTF/glb loads.
- Cost: 4 parallel Opus builders used ~90% of a 5-hour window in ~20 minutes, so builders run on Sonnet from
  round 2. The run pauses at 88% of the 5-hour window or 90% weekly (claude-hud usage-snapshot.json).
