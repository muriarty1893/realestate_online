# Status: paused 2026-11-07 (5-hour usage 88%, weekly 59%), after exterior r12, great room r12 (r13 in flight), master r15

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
| piece | latest (beat or tied its predecessor in a blind regression check) | biggest gap left (critiques/LOG.md has all of them) |
|---|---|---|
| exterior | round 12: dense photo-traced canopy and the inside-out trunk fix (r11, Opus), blue sky in the canopy gaps, softer olive leaves, ribbon moss (r12) | the beds (volume, varied species and heights, a palm by the entry, mulch hidden); windows (deep amber with rooms behind; round 14's glow won its area, port it from `shots/exterior/rejected/round_13_14.patch`); moss streaks by the chimney; the empty right edge. Rounds 13–14 rejected (wall tone, trim) |
| great_room | round 12: continuous L sectional (r9), leather sheen (r11), darker walnut cabinets, grey distressed rug (r12) | the leather (seven rounds): the armchair crop (`shots/great_room/armchair_ours_vs_photo.png`) shows the cause: boxy recliner form, a pale suede-looking seat top, matte blotchy finish; the photo's are slim club chairs on tapered legs with glossy highlights. Round 13 (Opus) was building that rebuild at the pause; see below |
| master_suite | round 15: layered cloth bedding (r11–12), 17 cm satin oak planks (r13), calmer wrinkles and falloff decals (r15, a tie with r13) | lighting (warm low sun raking across the room; but not on the bed: round 14 rejected), the bench knit, the right-edge sheer, the floor's orange left / dark right. Round 16 rejected (dim, plastic duvet); port only its lower pillow stack (`shots/master_suite/rejected/round_16.patch`) |
| rest | QA pass done | garage is the weakest view (flat concrete, no car); stiff towels and shower curtains |

The full critiques are in `critiques/LOG.md`. Blind pairs are built with random A/B order at the photo's size,
as PNGs with metadata stripped, and each critic reads only those two files. Regression triples (photo R plus two
renders X/Y in random order) are built inline; the answer keys are in the session scratchpad `keys/pairs.txt`.

## Next steps (in order)
1. Great room round 13 (club-chair rebuild, glossy leather): judge it if it finished (critic plus regression vs round 12); its state is noted under "At the pause" below.
2. Master suite: port round 16's lower pillow stack onto round 15 (small, Sonnet); keep round 15's exposure and warmth.
3. Exterior: port round 14's window glow onto round 12 (small, Sonnet); then the beds (an Opus rebuild may be needed: three Sonnet rounds of bed tweaks did not register at critic size).
4. Shell: a 2 px light leak on wall `w_x664a` at (-8.93, 2.26, -7.82), where `w_wicS2` butts into it with no overlap (x 664 px), right where the master's fake sun light is aimed.
5. Window views from the interiors show the exterior's cut-out foliage; critics flag them in both interiors.

## Lessons from 2026-11-07
- Matching sampled numbers lost twice more (great room r10 earlier, master r16 now): lowering exposure to the photo's sampled wall values made the room "dim and muddy". The photo reads bright and warm; judge by the blind check.
- Critics contradict each other on details (exterior walls whiter vs creamier; dark gable trim "cartoonish" vs "matches R"). Trust signals repeated across rounds and critics; port single-area wins instead of whole rounds.
- Looking at a matched crop myself (the armchair) found the real cause of a seven-round complaint in one step. Do this before briefing a builder on a gap that keeps recurring.
- Bed and planting changes made at full resolution often don't register at critic size; builders should check at ~900 px wide.

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
