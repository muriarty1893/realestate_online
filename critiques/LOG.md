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

### master_suite: builder finished round 2, critic not run yet
The exterior's ridge cap still hangs into the ceiling, so a critic would just name it again. Run the master critic after the
exterior builder fixes it. Builder changes: contact-shadow decals, warm fill and env, procedural linen and crumpled duvet,
procedural oak planks and barn-door grain, a softer sun patch, a fuller right-edge curtain and no orange haze.

### exterior, rest: builders stopped early (user paused), with no source changes yet
