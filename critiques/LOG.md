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
