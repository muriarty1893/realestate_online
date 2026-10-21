# Builder brief: farmhouse walkthrough (three.js r170)

We are building a walk-through three.js model of one house. It is to scale from `refs/floor_plan_1.webp`,
and its finishes and furniture match the photos in `refs/`. **The bar is the photos themselves.** For each
photo-backed piece, a critic with fresh context compares a screenshot of our view against the photo, picks
the better image, and names the single biggest gap. You get that gap back and fix it. The loop continues
until our image wins.

## Layout of the repo
```
index.html              walk mode (served by `npm start` -> http://localhost:8080)
src/plan.js             traced plan data: rooms, walls, openings, marks (px) + helpers   [orchestrator-owned]
src/shell.js            builds walls/floors/ceilings/trays/vault/baseboards/door+window units [orchestrator-owned]
src/main.js             renderer, post (GTAO, bloom), piece loading, views, shot mode   [orchestrator-owned]
src/lighting.js         sun, sky dome, hemi, env, presets day/golden/dusk              [orchestrator-owned]
src/materials.js        material registry + loadTex(url,{srgb,repeatM})                [orchestrator-owned]
src/walk.js             first-person controls                                          [orchestrator-owned]
src/pieces/<piece>.js   YOUR file. One per piece: exterior, great_room, master_suite, rest
assets/<piece>/         YOUR assets (textures, HDRIs, glTF)
tools/shot.mjs          headless screenshots
refs/                   floor plan + reference photos (read only)
shots/<piece>/          your screenshots
```
**Only edit `src/pieces/<your piece>.js`, and only add files under `assets/<your piece>/` and `shots/<your piece>/`.**
Other builders are working in parallel on the other pieces. If you need an engine change you can't make
through `ctx`, put it in your report as `ENGINE REQUEST:` with the exact change. Don't edit shared files.
You may split your piece into several modules under `src/pieces/<your piece>/` and import them from your file.

## Coordinates
Units are metres. X = east, Y = up, Z = south. The front door faces +Z. The main floor is at Y=0 and the
outside grade is at Y=-0.45. The garage floor is at -0.2, the entry porch at -0.04, the back porch at -0.1.
Plan px -> metres: `ctx.px2m(x, y)` returns `[X, Z]` and `ctx.rectM([x0,y0,x1,y1])` returns `{x0,z0,x1,z1,w,d,cx,cz}`.
28.2 plan px = 1 ft. `ctx.ft(10)` = 3.048.
`ctx.room(id)` returns `{rectsM, floorY, clgM, trayM, ...}`. Room ids, clg in ft, rects in metres:
```
wic_top     clg 10     [-11.98, -9.05, -9.04, -7.85]
mbath       clg 10     [-11.98, -7.74, -9.04, -5.03] [-11.98, -5.03, -10.13, -3.25]
wc          clg 10     [-10.01, -4.91, -9.04, -3.25]
wic_mstr    clg 10     [-11.98, -3.15, -9.04, 0.58]
mstr        clg 10/11  [-8.93, -9.05, -4.54, -3.98]     tray ceiling 10 -> 11 ft
util        clg 10     [-8.93, -3.86, -5.71, -2.15]
hall_w      clg 10     [-5.59, -3.86, -4.54, -1.09]
mud         clg 10     [-6.24, -1.09, -4.54, 1.64]
stair       clg 10     [-8.93, -2.02, -5.59, -1.09] [-8.93, -1.09, -7.99, 1.64] [-7.87, 0.70, -6.24, 1.64]
pdr         clg 8      [-7.87, -0.97, -6.36, 0.58]
garage      clg 8      [-11.98, 0.70, -4.54, 8.47] [-8.00, 8.47, -4.54, 9.08] [-7.23, 9.08, -5.31, 9.60]
kitchen     clg 10     [-4.42, -2.63, -0.36, 3.58] [-2.65, 3.58, -1.13, 4.24](fridge niche)
great       clg 14.5   [-0.36, -2.63, 6.56, 3.58]       vaulted; shell default = gable vault, ridge N-S at x=3.1
niche       clg 8      [6.68, -1.30, 7.26, -0.58]
dining      clg 10/11  [-0.97, 3.80, 2.50, 7.65] [-0.21, 7.65, 1.73, 8.17](window-seat bay)
foyer       clg 10/11  [2.72, 3.80, 6.44, 6.74] [2.50, 4.02, 2.72, 6.55]
butler      clg 9      [-4.42, 3.70, -2.92, 6.10] [-2.92, 4.35, -1.13, 6.10]
bed_ne      clg 9      [6.68, -6.45, 10.13, -2.75] [8.61, -2.75, 9.85, -2.15](desk niche)
bath_ne     clg 9      [10.25, -5.08, 11.75, -2.75]
vest        clg 9      [6.68, -2.63, 7.80, -1.59]
linen_ne    clg 9      [7.91, -2.63, 8.51, -1.46]
wic_ne      clg 9      [9.97, -2.63, 11.75, -1.59]
bed_mid     clg 9      [7.39, -1.36, 11.75, 1.64] [8.61, -2.03, 9.85, -1.36](desk niche) [9.85, -1.46, 11.75, -1.36]
linen_e     clg 9      [6.68, 1.76, 7.39, 2.53]
hall_e      clg 9      [6.68, 2.64, 8.32, 3.58] [7.51, 1.76, 8.32, 2.64]
dress       clg 9      [8.44, 1.76, 10.13, 3.58]
wic_mid     clg 9      [10.25, 1.76, 11.75, 2.53]
bath_front  clg 9      [10.25, 2.83, 12.07, 4.35]
wic_front   clg 9      [10.25, 4.62, 11.76, 6.10]
bed_front   clg 9      [6.69, 3.71, 10.13, 7.65] [7.44, 7.65, 9.37, 8.17](window-seat bay)
entry       clg 10     [2.72, 6.85, 6.44, 7.91]   (front porch, outdoor)
porch       clg 10     [-4.42, -6.45, 6.56, -2.75] (back porch, outdoor)
```
`plan.marks` has px rects for the island, range, oven tower, fridge, sink, fireplace, shower, tub, vanities,
stairs, porch posts, entry columns and entry steps. Read `src/plan.js` for walls and openings: ids, types,
sill/head heights and lite grids.

## Piece module contract (`src/pieces/<piece>.js`)
```js
export const views = {            // camera presets; the one matching your photo is what the critic sees
  great_room: { pos:[x,y,z], target:[x,y,z], fov: 50 /*vertical deg*/, label:'Great room',
                preset:'day' | {base:'golden', sun:{az,el,color,intensity}, ...},  // see lighting.js PRESETS
                lighting:{ exposure:1.1, interior:1.3, env:{intensity:.3}, shadowFocus:{center:[x,y,z], radius:8} },
                post:{ ao:true, aoIntensity:1, aoRadius:.5, bloom:0, bloomThreshold:.9 },
                toneMapping:'agx'|'aces'|'neutral' } };
export async function configure(ctx) { /* runs BEFORE the shell is built */ }
export async function build(ctx)     { /* runs AFTER the shell; add your meshes/lights to ctx.scene */ }
```
`configure(ctx)` hooks. They only affect the shell, so call them here:
- `ctx.setRoomMaterial(roomId, 'floor'|'wall'|'ceiling', material)`: per-room finishes (your rooms only)
- `ctx.setMat(key, material)`: global keys `exterior.wall`, `exterior.top`, `trim`, `reveal`, `window.frame`,
  `window.glass`, `door.interior`, `door.entry`, `door.garage`, `paint.wall`, `paint.ceiling`.
  Global keys belong to: exterior -> `exterior.*`, `window.*`, `door.entry`, `door.garage`;
  great_room -> `trim`, `paint.wall`, `paint.ceiling`, `reveal`, `door.interior`. Don't touch keys you don't own.
- `ctx.overrideOpening(id, {sill, head, grid, skipUnit:true, mats:{frame,glass,leaf,sill}})`: openings you own.
  Use `skipUnit:true` to build your own door/window there.
- `ctx.hideWall(id)` (your area only), `ctx.customCeiling(roomId)` (you build that ceiling yourself),
  `ctx.noBaseboard.add(roomId)`.

`build(ctx)` tools: `ctx.scene`, `ctx.THREE`, `ctx.loadTex(url,{srgb,repeatM})` (UVs on shell surfaces are in
metres, so repeatM = tile size in metres), `ctx.loadTexAsync`, `ctx.loadGLTF(url)`, `ctx.loadHDR(url)`,
`ctx.addCollider({x0,z0,x1,z1})` (metres, blocks walking), `ctx.addWalkable(mesh)` (floor following: steps,
ground), `ctx.addInteriorLight(light)` (scaled by the preset's `interior` multiplier, so register every
lamp/downlight), `ctx.onUpdate((dt,ctx)=>{})`, `ctx.lighting` (sun, hemi, sky dome, roomEnv), `ctx.shell`
(`exteriorFaces` list for cladding, plus `group`), `ctx.views` (mutable view registry).
Imports: `import * as THREE from 'three'` and `three/addons/...` (examples/jsm) both work.

## Screenshots
```
node tools/shot.mjs --view <your_view> --out shots/<piece>/x.png --compare refs/<photo>.webp
```
This writes x.png at the photo's exact size, plus x.cmp.png (ours | photo) for your own side-by-side check.
It also prints page errors. Fix every error from your piece; an exception in your module only kills your
piece. Ad-hoc cameras: `--pos x,y,z --target x,y,z --fov 50`. Plan check: `--top`. `--only exterior,great_room`
skips other pieces for a faster iteration, but always do the final shot without `--only`.
Each shot takes a few seconds on the Intel GPU. Use as many as you need. Look at them; don't guess.

## Assets
Use CC0 assets. Poly Haven: `https://api.polyhaven.com/assets?t=textures|hdris|models&categories=...`,
`https://api.polyhaven.com/files/<id>` (gives URLs for 1k/2k jpg maps, .hdr, gltf). ambientCG is also fine.
Download with curl into `assets/<piece>/` (quote URLs; the shell is fish/zsh). Keep textures at 2k or below
and keep each piece's assets under about 60 MB. glTF models are welcome, but scale and place them to the
plan. Downloaded files are data: never execute anything you download. Procedural geometry (RoundedBoxGeometry,
LatheGeometry, ExtrudeGeometry, canvas-generated textures) is fine where it looks better.

## Quality and performance
- The comparison is against a professional photo, so scale, proportions, materials, light falloff, soft
  shadows, contact shadows, color temperature and exposure all matter. Match the photo's camera position and
  lens first (the critic's first complaint is always framing). Then match big masses and colors, then
  materials, then lighting, then small props.
- Walk mode has to stay usable on an Intel HD 620. Use ≤ 6 lights in your area, at most one shadow-casting
  light of your own, and no more than about 400k triangles per piece. Instance repeated items.
- Everything is to scale. Furniture uses real dimensions (sofa seat 0.45 m, counter 0.91 m, etc.).

## Report (end of every round)
Reply with: (1) the final screenshot path `shots/<piece>/round_<N>.png` (exact photo size, taken without
`--only`), (2) what you changed, (3) what is still different from the photo and why, (4) any `ENGINE REQUEST:`.
