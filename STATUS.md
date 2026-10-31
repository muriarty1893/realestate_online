# Status: paused 2026-10-31 ~21:00 UTC (5-hour usage 86%, weekly 24%), after exterior r6, great room r7, master r10

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

## Critic loop (the photo has won every blind A/B so far; latest round per piece, all pushed)
| piece | latest (beat its predecessor in a blind regression check) | biggest gap left (critiques/LOG.md has all of them) |
|---|---|---|
| exterior | round 6 (Opus): layered backlit canopy, bark, grey moss, sunset glow, finer pavers | flat facade light (no eave/awning shade, no canopy dapple); flowers in the beds; darker warm-grey roof; yellower window glow |
| great_room | round 7 (Opus): rebuilt sectional (`sofa.js`), worn cognac leather, chaise end | the sofa still reads as boxy next to flat lighting; add warm pendant and under-cabinet pools, contact shadows, contrast; cabinet grain |
| master_suite | round 10: upholstered base, softer right-edge linen, finer oak and jute | the duvet (rounds 6–10 circled it); rebuild the bedding as separate layered meshes, Opus |
| rest | QA pass done | garage is the weakest view (flat concrete, no car); stiff towels and shower curtains |

The full critiques are in `critiques/LOG.md`. Blind pairs are built with random A/B order at the photo's size,
as PNGs with metadata stripped, and each critic reads only those two files.

## Next steps (in order)
1. Great room: lighting pass (warm pendant and under-cabinet pools, contact shadows, corner falloff), then cabinet grain and backsplash joints.
2. Exterior: directional low warm key light with canopy dapple and soft shade under the eaves and awnings; flowering accents; roof tone.
3. Master suite: rebuild the bedding as layered meshes (Opus), the way the sofa rebuild worked.
4. Shell: a 2 px light leak on wall `w_x664a` at (-8.93, 2.26, -7.82), probably a shadow-map gap at the `w_wicS2` junction.

## Lessons from 2026-10-27
- Builders regress about half the time. The regression check (photo plus two of our renders, blind) is worth its cost.
- Single critics are noisy and sometimes contradict each other (the coffee table, bed density). Prefer pixel-measurable claims and the overlay check.
- Builders on Sonnet stop early (20–35 of 60 tool calls) and are cheap: a builder round costs ~0.5–1% of the weekly budget.
- Always run `node tools/tris.mjs` after a builder adds models (one round went to 12.6M triangles).
- Commit each piece's round locally as soon as its checks pass, so a regression can be reverted (round 4 and round 6 of the master were lost that way; round 9 was reverted cleanly).
- Hard modelling problems (the sofa, the canopy) needed an Opus builder and a rebuild, not parameter tweaks; Sonnet is fine for incremental fixes.

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
