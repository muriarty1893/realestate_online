# Critic log

Each round a fresh critic (no prior context) gets two same-size images, A and B, in random order: our screenshot
and the reference photo. It is not told which is which. It picks the better image and names the biggest gap.

## Round 1 (2026-10-23): baseline, the state the builders left on 2026-10-22

### exterior: photo won (critic saw ours as B)
**Biggest gap:** the lighting and shading are flat across the whole house. Walls, gables and roof are lit evenly. There
are no shadows under the eaves, the metal awnings or the porch roof, and no contact shading where the walls meet the plantings.
The glowing windows and door look pasted on because their light never reaches anything. It should be a warm, low sun raking
across the facade, with soft shadows under every overhang and the porch light washing the columns, steps, pavers and shrubs.
Further: (1) the foreground and foundation shrubs are noisy, speckled blobs on flat red-brown mulch; they need distinct
ferns, palms and flowering borders. (2) The canopy is flat, oversaturated cutout cards, and the Spanish moss is stiff straight
strands. (3) The roof is blotchy grey noise with no shingle courses or ridge and hip caps. (4) A pale gap shows through the
hedge at the right edge (x≈1700, y≈620). (5) The sky is flat blue with no dusk gradient, and the pavers are a flat pink tile.

### great_room: photo won (critic saw ours as A)
**Biggest gap:** the floor in the lower-left third is a flat, smeared grey-beige with no planks, grain or rug and almost no
contact shadows, so the furniture floats. It should be mid-tone wood planks, with a large, low-pile, mottled grey-beige rug
under the coffee table and both armchairs, and soft dark contact shadows.
Further: (1) The leather is saturated red-orange plastic with blown-out highlights; it should be a muted cognac tan with a satin sheen.
(2) The throw on the foreground sofa arm is a flat white slab; it should be a chunky knit with folds. (3) The pillows and
striped throw are rigid slabs. (4) The fridge and hood read as matte beige; they need brushed stainless, plus a warm under-cabinet
glow. (5) The dining window is a flat green backdrop, and the dining chairs are blocky.

### master_suite: photo won (critic saw ours as B)
**Biggest gap:** a dark, textured block hangs at an angle in the ceiling's upper left, between the barn-door track and the fan.
*Orchestrator check:* it vanishes with `--only master_suite`, so it's exterior geometry (probably a roof plane under the
11 ft tray), not the master suite's. Sent to the exterior builder.
Further: (1) There are no contact shadows under the bed, bench, nightstands or lamps, and no warm bounce light. (2) The bedding
is smooth plastic sheets; it needs linen texture, wrinkles and drape. (3) The window views are flat cartoon foliage with a
green band and an orange haze; they should be a slightly overexposed lawn, sky and neighbor house. *The foliage is exterior
vegetation.* (4) The floor is too red, with even, repeating planks; the barn-door grain looks stamped. (5) The right edge is
stretched by wide-angle distortion and the curtain is cut off, and the sun patch is blown out with hard edges.

## Round 2 (2026-10-23)

### great_room: photo won (critic saw ours as A)
Builder changes: the rug is resized to 9x12 ft from the photo and the wood floor shows; cognac leather without blown highlights;
knit throws; brushed stainless with a studio env; upholstered dining chairs; contact-shadow footprints.
**Biggest gap:** the leather sectional covers about 40% of the frame, and its cushions are puffy and rounded like modeling
clay. The leather is blotchy, with no seams, welting or stitching and no crisp edges on the arms and back. It should be
firm, tailored box cushions with sharp piped edges, seam lines, slight sitting creases, a sheen on the top edges and slim
track arms. The same goes for the armchairs, whose round back cushions are oversized blobs.
Further: (1) The lighting is flat and grey; it needs warm pools of light, glowing pendant bulbs, under-cabinet glow and soft
contact shadows. (2) The rug is a cloudy grey smear with no pile or edge, and the floor is washed out; it needs a faded vintage
pattern, a defined border and richer mid-brown planks with a sheen. (3) The foreground throw is a flat white sheet with a hard
cut edge. (4) In the dining zone, the chairs are featureless, the table is too red, the wall frame is blank, and the window is
a flat green backdrop (the exterior's). (5) The props are plain: slab books, paper-cutout plant leaves, too few pillows.
*Orchestrator note:* our sectional also sits closer to the camera than the photo's and fills the right half, and our coffee table
is left of where the photo has it. Re-check the living-group layout against the photo before reshaping cushions.

### master_suite: photo won (critic saw ours as A; run 2026-10-27 after the orchestrator clipped the hip caps)
**Biggest gap:** the lighting is flat and nothing is grounded. The room is evenly peach-lit with almost no real shadows,
and the bed, bench, nightstands and rug float. The sun patch left of the bed is faint and washed out. It should have strong
low sun from the left throwing crisp window-shaped patches across the wall, floor and rug, soft dark shadows under the bench,
bed base and floating nightstands, and falloff into the corners and toward the ceiling.
Further: (1) The duvet and a thin sheet are dragged diagonally across the bed with crinkled, foil-like wrinkles; it should be
a neatly made, puffy duvet with a folded linen throw across the foot. (2) The window views are a flat green band with
pasted-on foliage (the exterior's). (3) A grey, cut-off curtain strip at the right edge looks like a glitch. (4) There is an
orange/peach cast and lamp halos; the walls should be neutral warm-white. (5) The planks are oversized and repeat, the rug
tiles, the throw is stiff, and the curtains are opaque.
Round 2 builder changes: contact-shadow decals, warm fill and env, procedural linen and crumpled duvet,
procedural oak planks and barn-door grain, a softer sun patch, a fuller right-edge curtain and no orange haze.

### exterior: photo won (critic saw ours as A; builder ran 2026-10-27)
Builder changes: sun moved to the front-right, low and warm (az 150, el 13), with dappled tree shadows; a procedural shingle
texture with courses; a sky gradient; less pink stucco; background trees in the right-edge gap; a thin stone wainscot.
**Biggest gap:** the landscaping across the bottom 40%. The foundation shrubs are one dark, speckled mass with pink dot
noise that swallows the base of the house, the steps and the stone water table, in front of large bare beds of flat brown
mulch (worst at the lower left). The photo has low, layered planting (palms, ferns, hostas, white and pink flowering shrubs)
kept below the sills, with the stone base and steps visible and only thin mulch edges.
Further: (1) The light is flat midday with leaf shadows, but the windows glow, so the time of day contradicts itself; the photo
is soft dusk, with porch light spilling onto the columns and floor. (2) The window panes are flat orange gradients; they need
visible interiors and some reflection. (3) The siding is peach, and the board-and-batten barely shows; it should be crisp white
or greige, with visible battens and a stone water table. (4) The shingles are oversized purple-brown blotches; they should be
fine grey architectural shingles. (5) The canopy is flat yellow-green sprites, with a silhouette trunk.
*Orchestrator note:* the round 1 critic's "warm low sun raking the facade" misled the builder. The photo is dusk/blue hour,
with neutral, cool facade light from the sky; the warmth is only in the windows, porch lights and path lights.

### rest: builder stopped early (user paused), with no source changes yet

## Round 3 (2026-10-27)

### great_room: photo won (critic saw ours as B)
Builder changes: the sectional is nudged back and the coffee table moved and rotated to the photo's position; firm box cushions with
piped edges; a darker floor with clearcoat; a vintage lattice rug; the knit throw draped over the chaise; aoIntensity 1.4; glow decals.
**Biggest gap:** the sectional (centre-right and foreground) is built from separate boxy blocks, with flat tops and lips along
the arm and back edges (clearest on the near chaise end). The leather is a flat, matte orange-tan with no sheen, creases or
stitching. It should be one continuous L, with rounded padded arms, plump separate cushions, soft specular highlights, gentle
sitting wrinkles and darker folds.
Further: (1) Flat, even lighting with no contact shadows or AO under the armchairs, table, sofa and stools. (2) The throw is a
stiff sheet, and the pillows clip into each other and float. (3) The armchairs have the same blocky lipped arms. (4) In the dining
area, the right-wall frame is empty white, the chairs are lumpy blobs, and the window is a flat backdrop. (5) A stone-veneer stub
sits at the column base by the fridge; the backsplash has no grout; the floor and counters have no sheen.
*Regression check (blind, round 2 vs round 3 against the photo): round 2 is closer overall.* Round 2 wins on the sectional
(it reads as the photo's L, with a back row and a return toward the camera, backs on the right) and the rug (mottled grey-beige,
like the photo). Round 3 wins on the armchairs (crisp back, single seat, tapered legs), the coffee table (size, angle, full base)
and the floor tone (warm mid-brown). Lighting, kitchen and dining tie. Round 4 merges the two.

### master_suite: photo won (critic saw ours as B)
Builder changes: neutral-warm sun at 11 with a gobo patch at 300, less fill, AO 1.4/0.7, an additive floor sun patch, the bedding rebuilt
neat (smooth duvet, folded throw block), a cream back-lit sheer at the right edge.
**Biggest gap:** the bed is a flat tan slab with no wrinkles, a stiff padded band across the foot, nothing draping over the sides,
and hard-edged block pillows. It should be soft, layered linen with creases, a folded top sheet or quilt, fabric over the mattress edges,
and pillows that slouch.
Further: (1) The frame is hazy and low-contrast, the lower-left floor is blown out into a hard patch, and there are almost no contact shadows.
(2) The windows show a flat green band and cut-out foliage (the exterior's). (3) The curtains are rigid, evenly pleated and opaque.
(4) The bench throw repeats and looks sculpted. (5) A hard white glass edge cuts through the bath doorway, the vanity is orange, a plant
floats near the ceiling, and the art above the bed is a blurry smudge.
*Regression check (blind, round 2 vs round 3): round 2 is closer overall.* Round 2 wins on the bedding (rumpled duvet and draped cream
blanket, close to the photo), the colour (creamy ivory walls and ceiling) and the floor (warm oak; round 3's floor patch bleaches it).
Round 3 wins on the lighting (a crisp, bright wall sun patch, more contrast) and the barn door (richer mid-oak). The curtains, windows
and bath tie. Round 2 has spiky artifacts at the duvet's foot corner. Round 4 merges the two.

### exterior: photo won (critic saw ours as B)
Builder changes: instanced Poly Haven plants (shrubs, calathea, periwinkle, fern) replace the card blobs; dusk preset (sun near off, strong
soft hemi, three warm porch point lights); greige stucco and off-white board-and-batten; finer neutral-grey shingles; bluer glass.
**Biggest gap:** the foreground beds (the bottom third) are tall, wiry stalks dotted with flat magenta and yellow specks, rising past the
sills and hiding the stone base; the yard looks overgrown. They should be low, dense, mounded shrubs and fern clumps below the sills,
with varied leaf sizes, tidy beds with clean lawn edges, and the stone water table visible.
Further: (1) The canopy is a flat, saturated, noisy green mass on thick black branch tubes. (2) The sky is flat lavender-grey and the light
has no direction. (3) The siding has no batten relief or eave shadows; the trim lines are too crisp and black. (4) The porch light blows out
above the door, and the window glow is flat orange. (5) The lawn is a flat carpet, the mulch reads as black holes, and the pavers are uniform pink.
*Regression check (blind, round 2 vs round 3): round 3 is closer overall.* Round 3 wins on the soft facade light (no leaf shadows), the walls
and siding, the roof (even grey) and the entry glow. Round 2 wins on the sky (blue, not lavender) and the canopy (sunlit warm leaves; round 3's
is too dark). The planting is split: round 3's foreground is fuller, but its spindly magenta stalks look weedy.
*Orchestrator:* round 3 took the exterior from 236k to **12.6M triangles** (the plant models), far over the 400k budget. Must fix before pushing.
The "stone stub" by the fridge in the great room was the shell misclassifying `w_colS` as exterior (fixed in shell.js `classify`).

## Round 4 (2026-10-27): merge rounds 2 and 3 where the regression checks split

### master_suite: photo won (critic saw ours as A)
Builder changes: round 2's rumpled duvet, draped cream blanket and creamy walls are back (fills raised again); round 3's crisp wall sun patch
and AO are kept; the floor sun patch is removed; irregular, 80%-opaque curtains with floor-breaking hems; clearer shower glass; a lighter vanity.
**Biggest gap:** the bedding. The duvet is a thin, stiff sheet in two flat tones (brown left, cream right) with a hard seam down the middle,
crumpled-plastic folds and a tablecloth hang over the foot. The pillows are rigid wedges. It should be a thick linen duvet with soft volume,
a folded-back top edge showing the sheet, a cream blanket across the lower third, and plump, creased, overlapping pillows.
Further: (1) The window views are a flat green band with cut-out leaves (the exterior's). (2) The wall sun patch is an oversaturated orange
rectangle, with no sun on the floor, bed or rug. (3) The rug tiles visibly and has a hard edge. (4) The planks are too wide and uniform, with an
odd separate floor strip between the rug and the right wall. (5) The right-edge curtain is ghostly see-through; the bench and bed lack contact shadows.
*Regression check (blind, round 2 vs round 4): round 4 is closer, narrowly* (its crisp sun patch shows the pane shapes). Round 2 had warmer,
solid curtains (in round 4 the tree shows through the right-hand curtain). Both are still too evenly lit: they need darker corners and ceiling.

### great_room: photo won (critic saw ours as A)
Builder changes: round 2's sectional geometry, placement, pillows, throws and rug are back; round 3's armchairs, coffee table and floor are kept;
firmer cushions with baked vertex-colour shading (seams, rims, undersides, creases); lower leather specular; the dining-wall art now faces the room.
**Biggest gap:** the sectional still looks like flat, matte orange clay: puffy, lumpy forms, no seams, piping or stitching, no sheen, back cushions
that barely separate, and the near arm and corner melted together. It should be tan leather with soft highlights and creases along the
cushion tops, crisp tailored edges, distinct seat and back cushions with visible seams, and darker tone where cushions meet.
Further: (1) Flat, low-contrast light, no contact shadows under the chairs, table and stools, no warm under-cabinet glow or pooled light.
(2) The floor is pale and greyish, and the rug a blotchy grey smear; the photo has darker oak planks with seams and a worn, patterned rug.
(3) The white sphere and flat grey pillows look like plastic, and the throws are stiff sheets. (4) The backsplash has no grout lines, the cabinets
are over-saturated orange, and the stools are flat slabs. (5) The dining chairs are featureless, and the coffee table is chunky and toy-like with box books.
*Regression check (blind, round 2 vs round 4): round 4 is closer, narrowly* (tighter sofa and armchair cushions, the dining painting). Round 2 is
better on the **coffee table** (its extent, x≈335–895, matches the photo's ≈330–880; round 4's is too small and shifted left and up, which
contradicts round 3's check, so trust the pixel extents) and the floor (darker grey-brown grain). Neither has the photo's leather and striped
pillows or the throw over the left arm.

### exterior: photo won (critic saw ours as A)
Builder changes: the triangle count is down from 12.6M to 243k (`shrub_01`'s 156k-tri instances dropped; each plant mesh simplified at load with
SimplifyModifier to 400–900 tris, then instanced); plants fixed at 0.4–0.8 m; round 2's sunlit leaf materials are back; a clear blue sky with a
pale warm horizon; brown mulch; the east oak moved off the `bed_mid` window.
**Biggest gap:** the beds are now too empty: wide stretches of reddish-brown mulch with a few sparse ferns, and the foundation bed is almost
bare, so the whole stone base is exposed. It should be dense, layered foundation shrubs (boxwood-like mounds, a palm or two near the entry)
covering most of the stone band, and foreground beds full of ferns, hostas and low pink and white blooms, with almost no bare mulch.
Further: (1) The light is flat; it wants warm, low light with soft shadows under the eaves and awnings. (2) The canopy is flat repeated cards with
tube limbs; it needs depth, darker undersides, backlit edges, bark, and grey Spanish moss. (3) At the right, the house sits against an empty green plane
and a pink sky, where the photo has trees behind it. (4) The window panes are a uniform orange gradient, with a hot spot on the porch ceiling.
(5) The lawn is one flat green with hard bed edges.
*Regression check (blind, round 3 vs round 4): round 4 is closer.* It wins on the sky, the light, the visible stone base, the lawn and the canopy.
Round 3's beds were denser and more flowery, closer to the photo's lushness, but leggy. Next: fill round 4's beds with low mounds and blooms
below the sills. In both rounds the siding is too stark white (warm it to cream), and the roof is too dark blue-slate (lighten it to warm grey).
*Orchestrator:* walk-mode load went from ~17 s to ~27 s (headless, local), mostly from downloading and parsing the full-res plant models before
simplifying. Next: bake the simplified plants to small .glb files offline and load those. `shrub_01` (unused) was moved out of the repo.

## Round 5 (2026-10-27)

### great_room: photo won (critic saw ours as B)
Builder changes: the coffee table is back at round 2's pose (spans x≈335–895 like the photo), with its props; a darker grey-brown oak floor with
seams; tan leather with satin sheen and deeper baked rims and creases; darker contact shadows (stools too); a stronger living-area light pool.
**Biggest gap:** the sectional and armchairs still look like matte orange clay: one flat, blotchy tone, over-rounded blobs (worst at the back-right
corner and the foreground chaise arm), no piping or crisp seams. They need real leather sheen on the arm and cushion tops, darker creases and
under-cushion shadow, slightly slouched seats with wrinkles, and a tighter, tailored shape with defined arms.
Further: (1) Flat, shadowless light: no contact shadows, no warm pendant or under-cabinet pools, no window light falloff. (2) Soft goods: the foreground
throw is a flat sheet, the sofa throw is crumpled paper, the pillows are flat grey panels, and the sphere is plastic. (3) The olive stems are paper cards.
(4) The coffee-table books are blank slabs. (5) The rug is washed out; the dining chairs intersect each other and are bulbous.
*Regression check (blind, round 4 vs round 5): round 5 is closer, narrowly* (the table matches the photo; the stone pillar is gone thanks to the shell fix).
The table now reaches a bit too far toward the camera, into the chaise; the photo shows a gap.
*Orchestrator:* the sofa has resisted rounds 2 to 5 of parametric tweaks (cushion bulge, vertex-colour shading, sheen). The next attempt
should rebuild the cushion meshes from scratch (rounded-box cushions with real gaps, piping, and a measured leather PBR set), or use a CC0 model.

### master_suite: photo won (critic saw ours as B)
Builder changes: one thick oatmeal-taupe duvet drape with a folded-back sheet; a cream blanket across the lower third; plumper creased pillows; darker
fills; a less saturated wall sun patch; a soft golden floor patch by the door; opaque warm linen curtains; narrow varied planks (10–17 cm);
a non-repeating 2048 px chunky rug texture.
**Biggest gap:** the lighting and white balance. Flat, even fill with a strong orange-tan cast: a muddy beige-brown tray ceiling, peach walls,
and one solid caramel duvet. Nothing casts a shadow except the wall patch. The photo has clean warm-white walls and ceiling, low golden sun
across the bed, bench and rug, and darker corners and undersides. Go neutral white balance, with directional light on the bed and rug, and soft
contact shadows.
Further: (1) The floor is glossy and high-contrast like plastic, blown out at the bottom left, and its direction seems to differ left and right; it should be
matte, narrow oak running one way. (2) The duvet looks inflated, the pillows rigid, and the knit throw repeats and hangs stiffly. (3) The window views are
the exterior's flat foliage with a green band. (4) A dark brown curtain at the far right clashes with the light linen. (5) A plant floats at the top of the
bath doorway, with stray white specks by the barn door.
*Regression check (blind, round 4 vs round 5): round 4 is closer, narrowly.* Round 4 had the bright, airy cream ceiling and walls, the lit sheer
at the right edge, and the cream throw cascading down the bed's side. Round 5 has the better chunky rug, the sun sheen on the front-left floor and the
turned-down sheet. Round 4's code was never committed, so round 5 stays; take those three things back from round 4 next round (its fills
were hemi 0.62, bounce 0.4, glow point 0.8).

## Round 6 (2026-10-31)

### master_suite: photo won (critic saw ours as B)
Builder changes: warm-white walls and ceiling with a faint ceiling lift; bounce 0.4, glow 0.8; the right-edge sheer relit; the cream throw cascades down
the bed's right side; a matte floor (no clearcoat, roughness 0.85). Kept: the jute rug, the floor sun sheen, the turned-down sheet, the narrow planks.
**Biggest gap:** the bedding. The duvet is a smooth, evenly shaded tan slab with no wrinkles or fabric texture; the white throw is a thin, stiff ribbon
hanging straight down the right side toward the floor; the pillows look plastic. It should be soft linen with loose folds and creases, a layered throw
that drapes and bunches at the foot, slubby, slightly crushed pillows, and soft shadows between the layers.
Further: (1) The window views (the exterior's). (2) Hazy and low-contrast, and the furniture floats; it needs deeper corners and contact shadows. (3) The floor is too
orange and saturated, with a visibly repeating plank pattern. (4) The rug and the bench throw are oversized and tiled; the throw is a stiff shell. (5) **The right-edge
curtain is a dark, smeared, blurry column**; it should be light, translucent linen.
*Regression check (blind, round 4 vs round 6): round 6 is closer* (contrast, the rug sun patch, the warm golden-cream tone, the tucked layered bedding, the floor).
Round 4 wins only on the right-edge curtain (pale, sheer); round 6's turns dark and heavy. Round 4's diagonal throw fall matched the photo slightly better.
The master builder raycast two non-master defects: the floating plant at the top of the bath doorway is the exterior's `bg0` tree (sent to the exterior
builder), and a 1–2 px white speck on the west wall at (-8.93, 2.25, -7.82) near the door track (cause unconfirmed; maybe a shell seam leak).

### exterior round 5: photo won (critic saw ours as A)
Builder changes: plants baked offline (`tools/bake_plants.mjs` -> `assets/exterior/models_baked/`, no runtime simplify; load ~24.5 s -> ~18.7 s local);
periwinkle rendered for the first time (runtime simplify used to give 0 tris); boxwood-like mounds over the stone band; blooming mounds and hosta clumps
in the front beds; cream siding and batten; a lighter warm roof; background trees at the right; an amber porch ceiling; `bg0` moved out of the master bath. 372k tris.
**Biggest gap:** the light and foliage. The oak canopy (top and both sides) is flat, saturated cutout leaves with no depth or light passing through; the trunks
are smooth dark tubes; the ferns and shrubs are noisy uniform clumps. The photo's canopy has fine layered leaves with warm sunset light through them, soft
background trees, mossy bark, and planting with varied leaf shapes and pink and white flowers.
Further: (1) Flat, uniform light with no warm sky glow or soft eave shadows. (2) The pavers are large, orange and blurry with no joints, and the walk narrows
too sharply; they should be small, crisp, muted tan and grey. (3) The lawn is flat neon green with a hard edge. (4) The roof is a tiled texture without shingle
courses. (5) The windows are a flat orange glow, and the spot over the door looks artificial.
*Regression check (blind, round 4 vs round 5): round 5 is clearly closer* (beds, cream siding, the lighter roof, the right-side trees). Round 4's warm sunset glow
low in the sky is better; take it back.

## Round 7 (2026-10-31)

### master_suite: photo won (critic saw ours as A)
Builder changes: the dark right-edge column was the 0.93-opacity sheer showing the black window frame behind it at a grazing angle, now opaque light linen
(no shadows); a real woven linen texture (8 px pitch); broad diagonal duvet folds; the throw raised, wider and more skewed; crushed pillows; a muted floor,
with the plank tile stretched to 5.6 m; darker contact shadows; a slumping bench knit.
**Biggest gap:** the bedding. The duvet is a stiff, glossy brown shell; the cream throw has jagged, torn-looking edges; a sheet flap hangs off the near right
corner; the bed base pokes out as a separate brown box. It should be matte washed linen with fine creases, layered taupe and cream folding neatly over the
top, draping evenly down both sides, with clean tucked edges.
Further: (1) The bench knit is a rigid chunky plastic shell. (2) The light is flat and over-warm, with blown wall highlights, a smeary sun patch and few contact shadows.
(3) The curtains are stiff and opaque; the frame-right one is smeared. (4) The rug is a coarse, repeating grey-beige with a hard edge; the photo's is fine ivory jute.
(5) The window views (the exterior's).
*Regression check (blind, round 6 vs round 7): round 6 is closer, narrowly.* Round 6's cream blanket lay folded across the middle and draped off the right side
like the photo's; round 7's is bunched near the pillows, with a stiff white sheet panel at the right corner, plus a notch artifact on the bench knit (≈ x 800,
y 830). Round 7 is better on the right-edge curtain (light linen; round 6 had a dark strip) and the duvet's fine wrinkle texture. Round 6's code was not committed,
so round 7 stays and round 8 restores the blanket layout. From now on, each piece's round is committed locally as soon as it finishes.

## Round 8 (2026-10-31)

### master_suite: photo won (critic saw ours as B)
Builder changes: the blanket is back across the middle, draping off the right side; the round-7 sheet panel is gone (narrower, hidden mattress); a matte duvet
(roughness 1, no sheen, lighter taupe 0xc6b49d) with finer creases, draping 0.5 m at the sides and 0.42 m at the foot; a paler inset bed base; the bench-knit notch is fixed.
**Biggest gap:** the bed. The duvet is a stiff, uniformly quilted shell; at the foot-right corner it pokes out into a sharp triangular flap hanging in mid-air; the base
shows as a black plinth band. It should be soft linen with loose, irregular folds falling naturally over the sides, and a base upholstered like the headboard that sits
flat on the floor with no dark gap. A second throw layered at the foot would help.
Further: (1) Flat, washed-out light with no contact shadows, darker corners or window light on the floor and bedding. (2) The window views (the exterior's). (3) The right
edge: the sheer is blown out and smeared. (4) The rug repeats like a grid; the planks are too orange and evenly striped. (5) The bench throw is a flat cable-knit decal;
stray dots near the barn-door rail.
*Regression check (blind, round 6 vs round 8): round 8 is closer, narrowly* (light right-edge linen, woven duvet texture). Round 6 had the better throw layout
(over the right half, spilling to the floor) and a cleaner front-right duvet corner. Both need a less orange floor and a richer rug weave.

## Round 9 (2026-10-31)

### master_suite: photo won (critic saw ours as B); **reverted to round 8**
Builder changes: the foot-right flap is gone (the corner falls radially); the base is upholstered like the headboard with no plinth; the throw is back at round 6's layout;
fewer, larger duvet folds and a finer weave; a greyer floor; a finer jute rug (230×150 loops). The speck by the barn-door rail raycasts to the shell's west wall
`w_x664a` at (-8.93, 2.26, -7.82): two bright pixels, probably a shadow-map light leak at the junction with `w_wicS2` (not yet fixed).
**Biggest gap:** the duvet is an inflated caramel balloon with a jagged, scalloped edge at the turndown, and its sides bulge instead of hanging.
Further: the right-edge curtain is a blown-out white streak; the rug speckle is noisy and coarse; the floor planks are oversized and orange; flat, overexposed light; the window views.
*Regression check (blind, round 8 vs round 9): round 8 is slightly closer* (its bed top: the diagonal blanket, the flatter linen duvet, no scalloped sheet).
Round 9's only win is the bed base (a clean upholstered box, no pointed corner hanging onto the rug). The master files are reverted to commit 08a8cbf;
round 9's diff is kept in `shots/master_suite/rejected/round_9.patch` for its base code.

## Round 6, great_room (2026-10-31): the sectional rebuild (Opus builder)
Builder changes: a new `great_room/sofa.js` replaces the parametric sofa: every cushion and frame part is its own rounded box with a crowned top, 8 mm gaps (seams come
from AO and shadow), piping built in each cushion's local frame, darker sides and undersides; a tailored track arm, firm seats, plump backs on a 0.66 m frame;
the Poly Haven `brown_leather` set (CC0, ~4 mm grain) tinted to the photo's cognac, roughness ~0.55, light clearcoat; the armchairs rebuilt the same way; pillows
moved forward; the striped throw over the back by the arm; the knit throw along the near arm. 248k tris.
**Blind critic: photo won (critic saw ours as B).** Biggest gap: still the sectional — flat, oversaturated orange-rust, evenly lit; the back cushions are oversized rounded
blobs. It should be muted cognac/tan with soft sitting wrinkles, stitched seams, varying gloss along arms and tops, darker under the seat front and between cushions,
and slimmer, tighter back cushions.
Further: (1) Almost no contact shadows; flat, low-contrast light. (2) The olive stems and dining sprigs are paper cutouts. (3) The foreground throw drapes stiffly like a sheet (no knit, no fringe).
(4) The kitchen cabinets are uniform light orange with no grain. (5) The window is a blank green field; the books are grey blocks.
*Regression check (blind, round 5 vs round 6): round 6 is clearly closer* — tailored cushions, piping, the leather's sheen and shading, structured chairs, pillow placement.
Round 5's hue was slightly nearer (less orange). Both have an awkward foreground chaise slab with the blanket; the photo has a low chaise end running toward the camera at the bottom right.

## Round 10, master_suite (2026-10-31)
Builder changes: round 9's bed base ported onto round 8 (headboard upholstery, flat on the floor, a softer contact shadow; the duvet corner falls radially); the right-edge
curtain emissive is lowered (2.3/2.6 -> 0.9/1.0), so the folds read; narrower, greyer floor boards (7.5–12.5 cm) with neutral gaps; a finer, cream jute rug.
**Blind critic: photo won (critic saw ours as B).** Biggest gap: the duvet is one flat, even mid-brown slab with hard edges and few stiff folds; it should be lighter,
varied linen with many small folds, soft drape over the edges, and light falling across it from bright to shadow. Further: grounding shadows; the window views (the exterior's);
the floor at the bottom right is still orange with oversized planks; the right-edge sheer is still a smudge; the bench knit's V-pattern is cartoonish; the art is muddy.
*Regression check (blind, round 8 vs round 10): round 10 is closer, narrowly* (clean upholstered base with no plinth, a tidier duvet edge, a warmer cream rug). Round 8's bench
throw draped further down the front. Neither has the photo's pale layered throw over the lower half; the pillows are too dark and uniform.
*Orchestrator:* rounds 6–10 have circled the duvet without solving it; the next attempt should rebuild the bedding as separate layered meshes (Opus), the way the sofa rebuild worked.

## Round 6, exterior (2026-10-31, Opus builder)
Builder changes: a fine leaf-clump texture (26–40 clumps per cell, 18% warm leaves); a crown-depth pass darkens inner cards and gives outer cards a warm backlight glow;
two-sided leaf shading; leaf cards lifted off the limbs so the arching limbs read; Poly Haven oak bark (CC0) with moss; wispy grey Spanish moss; a sunset glow sphere low on the
right (exterior views only); smaller muted pavers with joints and a border; the walk widens toward the camera (2.26 -> ~2.9 m); a yellow-green lawn with mowing stripes. 377k tris.
**Blind critic: photo won (critic saw ours as B).** Biggest gap: lighting — flat and even across facade, roof and lawn, with no direction, no shade under the eaves, porch roof and awnings,
and no canopy dapple. It needs a low warm key from the side, canopy shadow and contact shadows. Further: the roof is flat grey-lavender without shingle relief or variation;
the foreground beds are dark, blurry ferns plus bare mulch strips, with no pink and white perennials; the trunks on the right look like straight poles; the windows are a uniform
orange with no interior; a bright green field and a beige block show through the trees at the right edge (~x 1700, y 600).
*Regression check (blind, round 5 vs round 6): round 6 is closer* (canopy value variation and backlit warmth, grey moss, beige pavers). Both: the roof should be darker warm grey,
the window glow more yellow, flowers in the beds, less red mulch.
Walk-mode load is ~21–24 s locally (measured while another builder was rendering on the GPU; noisy).

## Round 7, great_room (2026-10-31, Opus builder)
Builder changes: a shader adds worn lighter patches, mottling and soft gloss bands to the leather; less saturated base; baked darks go brown, not rust (sampled tones now match the photo:
darks 72,38,19 vs 71,38,18; mids 115,73,49 vs 119,75,46); slimmer back cushions (0.165 m), plumper seats with a sitting dip; a new low `chaiseEnd` with a padded rolled arm;
a fringed ribbed knit throw over it; folded, curved olive and sprig leaves at twice the count. 294k tris.
**Blind critic: photo won (critic saw ours as B).** Biggest gap: still the sectional, now "a stack of oversized, sharp-edged boxes in one flat, saturated orange-red" with uniform plastic shine,
and the right arm and back reading as separate blocks. Further: no contact shadows; the kitchen cabinets are pale orange with no grain, and the backsplash has no joints; stiff grey pillow, throw and ball;
the dining window is a flat field, and the dining chairs are white blobs; a dull floor and a faint rug.
*Regression check (blind, round 6 vs round 7): round 7 is closer* (the right return's back and arm, the slender olive leaves, the neatly draped front throw). Both lack the photo's warm
under-cabinet and pendant glow and the rug's contrast.
*Orchestrator:* the critic's "saturated orange" conflicts with the pixel-sampled match; the sofa probably reads orange next to the cool, flat surroundings. The global lighting
(warm pools, contrast, contact shadows) is now the great room's main lever.

## Round 8, great_room (2026-11-01, Sonnet builder): lighting pass
Builder changes: lower, warmer fill (hemi 0.45, env 0.42, exposure 1.02); AO 1.9 / radius 0.55; warmer under-cabinet strip, island and dining lights; darker, redder cabinet stain with a finer grain;
backsplash joints (normal 2.2, less emissive); a striped rug border and medallion (reverted, see below). Lights and triangles unchanged (6 lights, 294k).
**Blind critic: photo won (critic saw ours as A).** Biggest gap: the sectional still reads as a pile of separate blocks: back cushions at different heights, thick boxy backs and arms, a slab-like chaise arm
at bottom centre, hard seams. The photo's is one continuous L with a low, even, tight back, slim rounded arms, slightly sagging creased cushions and an unbroken seat line around the corner.
Further: flat saturated orange leather with uniform sheen (should be tan/cognac patina with varying highlights); no light direction (the photo has bright window daylight, under-cabinet glow, soft furniture shadows);
the rug's hard striped border; a chunky plank coffee table (photo: thinner reclaimed top on trestle legs); a flat green dining window, no curtains or window-seat cushions.
*Regression check (blind, round 7 vs round 8): round 7 closer, narrowly*, on the rug only (round 8's stripes look synthetic); every other area a tie (the lighting change is barely visible at this size).
*Orchestrator:* reverted the rug hunk and kept the rest as round 8. Next: an Opus rebuild of the sectional's silhouette as one continuous L, plus a stronger lighting change than this round's.

## Round 7, exterior (2026-11-01, Sonnet builder): directional light
Builder changes: a low warm key sun (az 118, el 19, 0xffd4a0, 3.4) with shadowFocus [4,2,12] r 27; hemi 2.5 -> 0.85, env 0.9 -> 0.5; leaf cards cast alpha-tested shadows (MeshDepthMaterial with the foliage atlas);
the env/sky glow keeps the old sun direction so the backlight stays; a warm mid-grey roof with per-tab/per-course variation and relief; yellow-gold window glow with a darker ceiling band and a lamp blob; darker, less red mulch. 377k tris.
**Blind critic: photo won (critic saw ours as A).** Biggest gap: the roof: shingles far too large and blotchy (patchy charcoal and light grey) with high-contrast dapple smeared across it; it should be small, even
architectural shingles in a uniform mid-grey, faint soft canopy shadow at most, a crisp ridge line and hip cap. Further: windows are flat glowing panels (need interior hints, gradient, faint sky reflection);
the foreground ferns fill the bottom quarter (should be clipped lawn both sides of the walk, low beds with pink and white flowers); the left oak trunk is a smooth dark silhouette (should be massive and furrowed);
the right edge (x 1650–1750) shows a pale wall and a flat green plane instead of layered backlit trees; the stone water table is too thin and dark, the fascia near-black instead of bronze-brown.
*Regression check (blind, round 6 vs round 7): round 7 closer, narrowly* (warm directional sun with depth, window colour, warmer pavers). Round 6 wins the roof (even soft grey; round 7's leaf shadow is camouflage-like)
and the walls (round 7's sun patches wash out the stucco/batten contrast).

## Round 8, exterior (2026-11-01, Sonnet builder): roof, stone, trim, windows (not committed as a round)
Builder changes: small even shingles (40 courses x 24 tabs per 2 m tile), roof stops receiving leaf shadows, lighter ridge/hip caps; stone water table 0.42 -> 0.66 m and lighter; bronze-brown fascia, gutters, soffit;
window glass with a ceiling-light glow, a sky streak and a vertical gradient.
**Blind critic: photo won (critic saw ours as B).** Biggest gap: the bottom third: dark, muddy, identical fern clumps on black mulch swallow the lawn. It should be low, lit, layered beds with varied leaves,
scattered pink and white flowers, light ferns at the edges, bright lawn on both sides of the path, stepping down toward the camera. Further: flat dark canopy and straight black trunks on the right;
the roof flat grey-mauve with no shingle texture; uniform beige window glow; blobby foundation shrubs on bare mulch; a blank green void at the right edge.
*Regression check (blind, round 7 vs round 8): round 7 closer, narrowly*, on the roof: the photo's is cool blue-grey with visible texture; round 8's is flat warm mauve-grey. Round 7 had the right hue but its patchy
variation should drop to about a third. Round 8 wins the stone band (taller, greyer). Everything else tied.
*Orchestrator:* kept round 8 in the working tree and sent the roof back to the builder (round 7's cool blue-grey, visible fine texture, low variation) plus the beds.

## Round 9, exterior (2026-11-01, Sonnet builder, continuing round 8)
Builder changes on top of round 8: a cool blue-grey roof (20 courses x 14 tabs per 2 m tile, granule speckle, stronger course shadows, low variation, no leaf shadow on the roof); the foreground mulch beds cut back
to low beds stepping toward the camera with open bright lawn both sides of the walk; the 390 identical fern clumps cut to a few at the edges; calathea, small shrubs, periwinkle and ~200 flowering mounds per bed. 372k tris.
**Blind critic: photo won (critic saw ours as A).** Biggest gap: the planting: the foreground clumps read as speckled noise (pink dots over a dark green mass, flat fern sprites on top) and the foundation beds as one
uniform dark lumpy hedge. The photo has layered beds: ferns and broad-leaf plants in front, shrubs of varied height and shape, a palm and agave-like accents, clusters of pink and white flowers, the stone base partly visible.
Further: a flat untextured bright lawn (needs grass texture, tone variation, soft shade under the trees); a thin, sparse canopy with a big empty sky (photo: a dense layered live-oak canopy across the top);
the roof a flat grey with a tiny repeating pattern; low contrast, pinkish flat walls (needs cooler shadows, warmer highlights); blank gradient windows and doors (interior hints, wood-stained doors).
*Regression check (blind, round 7 vs round 9): round 9 closer* (an even fine-grained roof, the taller lighter stone base, cleaner bed edges, more open lawn). Round 7's larger defined foreground ferns at the lower left are worth taking back,
kept below the lawn line. Neither has the photo's tall palm-like plant left of the entry or full flower-filled beds.
*Orchestrator:* the intermittent `requestfailed` lines are Chromium `net::ERR_ABORTED` on duplicate fetches; every load still resolved. `ctx.loadGLTF` now retries up to 3 times (with a warning) and shot.mjs hides ERR_ABORTED.

## Round 11, master_suite (2026-11-01, Opus builder): bedding rebuilt as layered meshes
Builder changes: new `master_suite/bedding.js`: a `clothGeo` sheet over a rounded box (wraps the edge, hangs, slight flare, radial corners, deepening vertical folds, curled hem), a crease field of hundreds of short folds,
vertex-colour shading (bright near the pillows, darker toward the foot and down the sides); a light taupe-grey linen duvet with a true-scale linen normal map; a turned-down band; a pale greige throw down the east half
with a folded second layer; nine lighter, varied pillows; the shared upholstery lightened (0x9a8068 -> 0xb1a395); the bench throw redrawn with the cloth function and a finer knit. 284k tris.
**Blind critic: photo won (critic saw ours as B).** Biggest gap: the bed: the duvet looks like two slabs with a hard seam down the middle; the throw is a flat panel pasted over the right half; the edges fall stiffly.
It should be one continuous duvet folded back below the pillows, a throw draped loosely across the lower third, soft folds hanging over the sides and foot. The pillows sit at random angles; they should stand in rows
(euro shams, sleeping pillows, accents) against the headboard. Further: the right-edge curtain is smeared; jagged cut-out leaves in the window views; no contact shadows (bench, bed, nightstands, rug);
the bench throw a stiff tent with a flat repeating knit; dark high-contrast planks at the right.
*Regression check (blind, round 10 vs round 11): round 11 closer* (greige palette near the photo, rumpled linen, the throw down the right side hanging off the edge, lighter base, the bench throw's lower drape).
Round 11's centre seam (two twin duvets) is its giveaway; round 10's duvet was one continuous surface.
