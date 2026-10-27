# Status: paused 2026-10-27 ~05:45 UTC (weekly usage 87%, guard 90%), after round 5

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

## Critic loop (the photo has won every blind A/B so far; latest round per piece)
| piece | latest | live in commit | biggest gap left (critiques/LOG.md has all of them) |
|---|---|---|---|
| exterior | round 4 (beat round 3 in the regression check) | df2909a | beds too empty: fill with low mounds, ferns and pink/white blooms below the sills; warm the siding to cream; lighten the roof |
| great_room | round 5 (beat round 4, narrowly) | df2909a | the sectional still reads as matte clay; parameter tweaks failed in rounds 2–5, so rebuild the cushions or use a CC0 model |
| master_suite | round 5 (round 4 was narrowly closer) | df2909a | orange-tan white balance and flat fill; take back round 4's bright ceiling, lit right-edge sheer and draped throw |
| rest | QA pass done | df2909a | garage is the weakest view (flat concrete, no car); stiff towels and shower curtains |

The full critiques are in `critiques/LOG.md`. Blind pairs are built with random A/B order at the photo's size,
as PNGs with metadata stripped, and each critic reads only those two files.

## Next steps (in order)
1. Exterior: bake the simplified plants to small .glb files offline and load those instead of the full-res models
   (walk-mode load went from ~17 s to ~27 s locally). Then the round 4 critique: denser low beds, cream siding, a lighter roof.
2. Master suite: round 4's take-backs (above), then neutral white balance with directional sun on the bed and rug.
3. Great room: rebuild the sectional (see the round 5 orchestrator note in LOG.md).
4. After each builder: a blind critic **and** a blind regression check against the previous round (they caught 3 regressions).

## Lessons from 2026-10-27
- Builders regress about half the time. The regression check (photo plus two of our renders, blind) is worth its cost.
- Single critics are noisy and sometimes contradict each other (the coffee table, bed density). Prefer pixel-measurable claims and the overlay check.
- Builders on Sonnet stop early (20–35 of 60 tool calls) and are cheap: a builder round costs ~0.5–1% of the weekly budget.
- Always run `node tools/tris.mjs` after a builder adds models (one round went to 12.6M triangles).

## To resume
1. `npm install` (node_modules is untracked now), then `npm start` and open http://localhost:8080
   (WASD walk, 1-9 views, L lighting, O AO).
2. Builders: fresh agents with BUILDERS.md plus the last critique. They finish with `shots/<piece>/round_<N>.png`.
3. Critics: a fresh agent per photo piece, with a blind A/B made by `tools/critic_pair.sh`. Log every round in `critiques/LOG.md`.

## Notes
- Vercel: three.js is vendored in vendor/three/ (Vercel never serves node_modules). `npm run vendor` refreshes it.
- tools/tris.mjs prints triangle, mesh and light counts per piece. Budget: ~400k per piece.
- shell.js classify(): points exactly on a shared room edge now count as indoors (w_colS fix).
- tools/serve.mjs now sends Content-Length. Without it, Chromium reported spurious `net::ERR_ABORTED` on glTF/glb loads.
- Cost: 4 parallel Opus builders used ~90% of a 5-hour window in ~20 minutes, so builders run on Sonnet from
  round 2. The run pauses at 88% of the 5-hour window or 90% weekly (claude-hud usage-snapshot.json).
