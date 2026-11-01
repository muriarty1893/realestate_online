# Status: paused 2026-11-01 (5-hour usage 88%, weekly 35%), after exterior r11, great room r11, master r13

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
| exterior | round 10: low warm key sun with leaf-shadow dapple (r7), cool blue-grey fine shingle roof, taller stone base, bronze trim (r9), readable ferns and flower clusters (r10), dense photo-traced canopy and the inside-out trunk fix (r11, Opus) | bluer sky in the canopy gaps; rectangular moss streaks near the chimney; fuller foundation beds (round 9's mounded shrubs); hide the flat lawn plane and white wall edge at the far right; window interiors (fresh critic not run on r11) |
| great_room | round 11: one continuous L sectional (r9, Opus), leather sheen with greyer shadows, draped throws (r11); warmer lower fill, darker cabinets, backsplash joints (r8) | the leather still reads orange and plastic (rounds 6–11); try the surround (darker floor and cabinets toward R) and tailored cushion edges/seams, not the hue. Round 10 (30% desaturation) was rejected as muddy |
| master_suite | round 13: bedding rebuilt as layered cloth meshes (r11, Opus), continuous duvet, throw over its folds, pillows in rows (r12), 17 cm satin oak planks, lumbar (r13) | lighting: keep the left-wall sun patch, add contact shadows and corner falloff, warm white not peach; no sun on the bed (round 14 rejected for leaf-dappled blotches); then softer linen wrinkles, the right-edge sheer, the bench knit |
| rest | QA pass done | garage is the weakest view (flat concrete, no car); stiff towels and shower curtains |

The full critiques are in `critiques/LOG.md`. Blind pairs are built with random A/B order at the photo's size,
as PNGs with metadata stripped, and each critic reads only those two files. Regression triples (photo R plus two
renders X/Y in random order) are built inline; the answer keys were in the session scratchpad `keys/pairs.txt`.

## Next steps (in order)
1. Great room: darken the floor and cabinets toward the photo (walnut-brown cabinets, mid-brown oak), then tailored sectional cushions (crisp welted edges, flatter tops, seams). Leave the leather hue alone.
2. Master suite: contact shadows and corner falloff with the left-wall sun kept; then smoother linen (fewer, larger folds) and the foot overhang.
3. Exterior: run a fresh blind critic on round 11 first; then sky colour in the canopy gaps, the moss streaks, fuller foundation shrubs, the far-right edge.
   Check the other pieces' tube/lathe builders for the same inside-out winding that darkened the exterior trunks.
4. Shell: a 2 px light leak on wall `w_x664a` at (-8.93, 2.26, -7.82), probably a shadow-map gap at the `w_wicS2` junction.
5. Window views from the interior show the exterior's cut-out foliage; critics flag them in both interiors.

## Lessons from 2026-11-01
- Pixel-matched colour can still lose: desaturating the whole leather to the photo's channel ratios made it "muddy" and lost its regression check. Match the look in context (surround, form, sheen), and verify with the blind check, not samples alone.
- A builder can misdiagnose a critic: the master's "centre seam" was the throw's straight edge, not the duvet mesh.
- Light through windows is shadowed by the exterior trees: a spot outside the master window put leaf dapple on the bed.
- `ctx.loadGLTF` retries now; the `requestfailed (net::ERR_ABORTED)` lines were harmless duplicate-fetch aborts and are filtered.
- Sending a short follow-up to the same builder (SendMessage) for a targeted fix worked well (exterior r9, master r12).

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
