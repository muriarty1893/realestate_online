# Status: paused 2026-10-22 18:40 (5h usage hit 93%)

## Done
- The plan is traced into `src/plan.js` at 28.2 px/ft. That scale checks out against 7 labelled rooms. The
  file holds 33 rooms, ~140 walls, ~55 doors and windows, plus fixture marks.
- The engine works: shell (walls, openings, floors, ceilings, trays, vault, baseboards, door and window units),
  lighting presets, GTAO/bloom post, walk mode with collision (60 fps on the bare shell) and headless screenshots
  (`tools/shot.mjs`, GPU via Vulkan).
- `BUILDERS.md` is the brief every builder works from.

## Paused mid round 1 (nothing has been critiqued yet)
| piece | photo | state when paused |
|---|---|---|
| exterior | refs/front_view.webp | stub only |
| great_room | refs/inside_view_1.webp | textures and models downloaded (assets/great_room); piece file still a stub |
| master_suite | refs/inside_view_2.webp | textures, models and helper modules (src/pieces/master_suite/); was starting the bedroom furniture |
| rest | none | textures and kit module (src/pieces/rest/); was starting materials and furniture |

## To resume
1. `npm start`, then open http://localhost:8080 (WASD walk, 1-9 views, L lighting, O AO).
2. Restart or resume the 4 builders with BUILDERS.md and their piece. Each finishes round 1 with
   `shots/<piece>/round_<N>.png`.
3. Critic loop per photo piece: a fresh critic gets ours and the photo as blind A/B (random order, same size),
   picks the better one and names the biggest gap. The gap goes back to the builder. Log every round in
   `critiques/LOG.md` and repeat until ours wins.

## 2026-10-22 notes
- Vercel fix: three.js is vendored in vendor/three/ (Vercel never serves node_modules). `npm run vendor` refreshes it.
- All 4 builders are still mid round 1, and no critic has run yet. Resume them with SendMessage; their transcripts persist.
- Cost: 4 parallel Opus builders used ~90% of a 5-hour window in ~20 minutes. Run fewer in parallel or use a cheaper model for builders.
