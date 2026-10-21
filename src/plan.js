// Floor plan data traced from refs/floor_plan_1.webp (3000x2000 px).
// All rects are [x0, y0, x1, y1] in ORIGINAL plan pixels (x right = east, y down = south/front).
// Scale verified against 7 labelled room sizes: 28.2 px per foot.
// World space: metres, X = east, Y = up, Z = south (the front door faces +Z). Main floor at Y = 0.

export const PX_PER_FT = 28.2;
export const FT = 0.3048;
export const M_PER_PX = FT / PX_PER_FT;
export const ORIGIN_PX = [1500, 1000];
export const GRADE_Y = -0.45; // finished grade outside (front steps rise ~18")

export const px2m = (x, y) => [(x - ORIGIN_PX[0]) * M_PER_PX, (y - ORIGIN_PX[1]) * M_PER_PX];
export const ft = (f) => f * FT;
// rect in px -> {x0,z0,x1,z1,w,d,cx,cz} in metres
export function rectM(r) {
  const [x0, z0] = px2m(r[0], r[1]);
  const [x1, z1] = px2m(r[2], r[3]);
  return { x0, z0, x1, z1, w: x1 - x0, d: z1 - z0, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 };
}

export const DEFAULT_WALL_FT = 10;
const GR = 14.5; // walls that border the vaulted great room run up to the vault peak

// ---------------------------------------------------------------- rooms
// owner = which piece module may restyle it. clg = ceiling height in ft.
export const rooms = [
  // master wing
  { id: 'wic_top', name: 'WIC 9-8x4-0', rects: [[392, 163, 664, 274]], clg: 10, floor: 'wood', owner: 'master_suite' },
  { id: 'mbath', name: 'Master bath 9-8x14-8', rects: [[392, 284, 664, 535], [392, 535, 563, 699]], clg: 10, floor: 'tile', owner: 'master_suite' },
  { id: 'wc', name: 'Master WC', rects: [[574, 546, 664, 699]], clg: 10, floor: 'tile', owner: 'master_suite' },
  { id: 'wic_mstr', name: 'WIC 9-8x12-3', rects: [[392, 709, 664, 1054]], clg: 10, floor: 'wood', owner: 'master_suite' },
  { id: 'mstr', name: 'Master suite 14-4x16-8 (10ft step to 11ft)', rects: [[674, 163, 1080, 632]], clg: 10, tray: 11, trayRect: [712, 205, 1043, 465], floor: 'wood', owner: 'master_suite' },
  { id: 'util', name: 'Utility 10-7x5-7', rects: [[674, 643, 972, 801]], clg: 10, floor: 'tile', owner: 'rest' },
  { id: 'hall_w', name: 'Rear hall', rects: [[983, 643, 1080, 899]], clg: 10, floor: 'wood', owner: 'rest' },
  { id: 'mud', name: 'Mud 5-7x7-4', rects: [[923, 899, 1080, 1152]], clg: 10, floor: 'wood', owner: 'rest' },
  { id: 'stair', name: 'Stairs (up to bonus / down to basement)', rects: [[674, 813, 983, 899], [674, 899, 761, 1152], [772, 1065, 923, 1152]], clg: 10, floor: 'wood', owner: 'rest' },
  { id: 'pdr', name: 'Powder 5x5', rects: [[772, 910, 912, 1054]], clg: 8, floor: 'tile', owner: 'rest' },
  { id: 'garage', name: 'Two car garage 24-4x22-0', rects: [[392, 1065, 1080, 1784], [760, 1784, 1080, 1840], [831, 1840, 1009, 1888]], clg: 8, floor: 'concrete', floorY: -0.2, owner: 'rest' },
  // living core
  { id: 'kitchen', name: 'Kitchen 13-0x20-4', rects: [[1091, 757, 1467, 1331], [1255, 1331, 1395, 1392]], clg: 10, floor: 'wood', owner: 'great_room' },
  { id: 'great', name: 'Great room 23-0x20-4 (14-6 vaulted)', rects: [[1467, 757, 2107, 1331]], clg: 14.5, vault: true, floor: 'wood', owner: 'great_room' },
  { id: 'niche', name: 'Great room niche', rects: [[2118, 880, 2172, 946]], clg: 8, floor: 'wood', owner: 'great_room' },
  { id: 'dining', name: 'Dining 11-4x12-8 (10ft step to 11ft)', rects: [[1410, 1352, 1731, 1708], [1481, 1708, 1660, 1756]], clg: 10, tray: 11, trayRect: [1450, 1390, 1695, 1670], floor: 'wood', owner: 'great_room' },
  { id: 'foyer', name: 'Foyer 12-7x9-7 (10ft step to 11ft)', rects: [[1752, 1352, 2096, 1624], [1731, 1372, 1752, 1606]], clg: 10, tray: 11, trayRect: [1790, 1390, 2060, 1600], floor: 'wood', owner: 'great_room' },
  { id: 'butler', name: 'Butler pantry 10-7x5-8', rects: [[1091, 1342, 1230, 1564], [1230, 1402, 1395, 1564]], clg: 9, floor: 'wood', owner: 'great_room' },
  // bedroom wing
  { id: 'bed_ne', name: 'Bedroom 11-4x12-2', rects: [[2118, 403, 2437, 746], [2297, 746, 2411, 801]], clg: 9, floor: 'wood', owner: 'rest' },
  { id: 'bath_ne', name: 'Bath 5x7-8', rects: [[2448, 530, 2587, 746]], clg: 9, floor: 'tile', owner: 'rest' },
  { id: 'vest', name: 'Bedroom vestibule', rects: [[2118, 757, 2222, 853]], clg: 9, floor: 'wood', owner: 'rest' },
  { id: 'linen_ne', name: 'Linen', rects: [[2232, 757, 2287, 865]], clg: 9, floor: 'wood', owner: 'rest' },
  { id: 'wic_ne', name: 'WIC 6-0x3-6', rects: [[2422, 757, 2587, 853]], clg: 9, floor: 'wood', owner: 'rest' },
  { id: 'bed_mid', name: 'Bedroom 14-4x10-3', rects: [[2184, 874, 2587, 1152], [2297, 812, 2411, 874], [2411, 865, 2587, 874]], clg: 9, floor: 'wood', owner: 'rest' },
  { id: 'linen_e', name: 'Hall linen', rects: [[2118, 1163, 2184, 1234]], clg: 9, floor: 'wood', owner: 'rest' },
  { id: 'hall_e', name: 'Bedroom hall', rects: [[2118, 1244, 2270, 1331], [2195, 1163, 2270, 1244]], clg: 9, floor: 'wood', owner: 'rest' },
  { id: 'dress', name: 'Dressing 5-7x6 (jack and jill vanity)', rects: [[2281, 1163, 2437, 1331]], clg: 9, floor: 'tile', owner: 'rest' },
  { id: 'wic_mid', name: 'WIC 5x2-8', rects: [[2448, 1163, 2587, 1234]], clg: 9, floor: 'wood', owner: 'rest' },
  { id: 'bath_front', name: 'Bath 6x6', rects: [[2448, 1262, 2617, 1402]], clg: 9, floor: 'tile', owner: 'rest' },
  { id: 'wic_front', name: 'WIC 5x5', rects: [[2448, 1427, 2588, 1564]], clg: 9, floor: 'wood', owner: 'rest' },
  { id: 'bed_front', name: 'Bedroom 11-4x13-0', rects: [[2119, 1343, 2437, 1708], [2188, 1708, 2367, 1756]], clg: 9, floor: 'wood', owner: 'rest' },
  // covered outdoor areas (floors/ceilings built by shell, styled by exterior)
  { id: 'entry', name: 'Entry porch 13-0x3-6', rects: [[1752, 1634, 2096, 1732]], clg: 10, floor: 'pavers', floorY: -0.04, outdoor: true, owner: 'exterior' },
  { id: 'porch', name: 'Back porch 36-0x12-6', rects: [[1091, 403, 2107, 746]], clg: 10, floor: 'pavers', floorY: -0.1, outdoor: true, owner: 'exterior' },
];

// ---------------------------------------------------------------- walls
// h = top of wall in ft (default 10). Walls start below grade.
export const walls = [
  // master wing exterior
  { id: 'w_W1', r: [381, 153, 392, 423] }, { id: 'w_W2', r: [381, 532, 392, 1250] }, { id: 'w_W3', r: [381, 1700, 392, 1795] },
  { id: 'w_N1', r: [381, 153, 704, 163] }, { id: 'w_N2', r: [771, 153, 985, 163] }, { id: 'w_N3', r: [1052, 153, 1091, 163] },
  { id: 'w_x664a', r: [664, 163, 674, 436] }, { id: 'w_x664b', r: [664, 519, 674, 724] }, { id: 'w_x664c', r: [664, 793, 674, 1152] },
  { id: 'w_x1080a', r: [1080, 163, 1091, 429] }, { id: 'w_x1080b', r: [1080, 595, 1091, 848] }, { id: 'w_x1080c', r: [1080, 931, 1091, 1851] },
  { id: 'w_wicS1', r: [392, 274, 507, 284] }, { id: 'w_wicS2', r: [567, 274, 664, 284] },
  { id: 'w_wcW', r: [563, 620, 574, 699] }, { id: 'w_wcN', r: [563, 535, 664, 546] },
  { id: 'w_mbS1', r: [392, 699, 486, 709] }, { id: 'w_mbS2', r: [566, 699, 664, 709] },
  { id: 'w_wicS', r: [392, 1054, 664, 1065] },
  { id: 'w_mstS1', r: [674, 632, 983, 643] }, { id: 'w_mstS2', r: [1060, 632, 1080, 643] },
  { id: 'w_utE1', r: [972, 643, 983, 720] }, { id: 'w_utE2', r: [972, 790, 983, 801] },
  { id: 'w_utS', r: [674, 801, 983, 813] },
  { id: 'w_pdrN', r: [761, 899, 923, 910] }, { id: 'w_pdrS', r: [761, 1054, 923, 1065] }, { id: 'w_pdrW', r: [761, 910, 772, 1054] }, { id: 'w_pdrE', r: [912, 984, 923, 1054] },
  { id: 'w_garN1', r: [664, 1152, 938, 1166] }, { id: 'w_garN2', r: [1011, 1152, 1080, 1166] },
  { id: 'w_garS1', r: [381, 1784, 548, 1795] }, { id: 'w_garS2', r: [614, 1784, 760, 1795] },
  { id: 'w_bump1', r: [748, 1795, 760, 1851] }, { id: 'w_bump2', r: [748, 1840, 831, 1851] }, { id: 'w_bump3', r: [819, 1851, 831, 1898] },
  { id: 'w_bump4', r: [819, 1888, 852, 1898] }, { id: 'w_bump5', r: [989, 1888, 1020, 1898] }, { id: 'w_bump6', r: [1009, 1851, 1020, 1898] },
  { id: 'w_bump7', r: [1009, 1840, 1091, 1851] },
  // kitchen / great room
  { id: 'w_kN1', r: [1091, 746, 1191, 757] }, { id: 'w_kN2', r: [1357, 746, 1467, 757] },
  { id: 'w_gN1', r: [1467, 746, 1511, 757], h: GR }, { id: 'w_gN2', r: [1679, 746, 1709, 757], h: GR }, { id: 'w_gN3', r: [1877, 746, 1907, 757], h: GR },
  { id: 'w_gN4', r: [2075, 746, 2140, 757], h: GR },
  { id: 'w_colN', r: [1456, 757, 1477, 842] }, { id: 'w_colS', r: [1457, 1304, 1477, 1331] },
  { id: 'w_kS1', r: [1091, 1331, 1163, 1342] }, { id: 'w_kS2', r: [1230, 1331, 1255, 1402] },
  { id: 'w_niche', r: [1230, 1392, 1395, 1402] },
  { id: 'w_gS1', r: [1395, 1331, 1497, 1352], h: GR }, { id: 'w_gS2', r: [1711, 1331, 1774, 1352], h: GR }, { id: 'w_gS2b', r: [1731, 1352, 1752, 1372] },
  { id: 'w_gS3', r: [2076, 1331, 2193, 1343], h: GR },
  { id: 'w_gE1', r: [2107, 853, 2184, 880], h: GR }, { id: 'w_nicheBack', r: [2172, 880, 2184, 946], h: GR },
  { id: 'w_fireplace', r: [2107, 946, 2184, 1163], h: GR },
  { id: 'w_gE2', r: [2107, 1163, 2118, 1254], h: GR }, { id: 'w_gE3', r: [2107, 1323, 2118, 1331], h: GR },
  // butler / dining / foyer
  { id: 'w_butS1', r: [1091, 1564, 1139, 1574] }, { id: 'w_butS2', r: [1193, 1564, 1300, 1574] }, { id: 'w_butS3', r: [1353, 1564, 1410, 1574] },
  { id: 'w_dinW1', r: [1395, 1352, 1410, 1450] }, { id: 'w_dinW2', r: [1395, 1518, 1410, 1708] },
  { id: 'w_dinS1', r: [1395, 1708, 1481, 1719] }, { id: 'w_dinBay1', r: [1471, 1719, 1481, 1766] }, { id: 'w_dinBay2', r: [1481, 1756, 1503, 1766] },
  { id: 'w_dinBay3', r: [1640, 1756, 1660, 1766] }, { id: 'w_dinBay4', r: [1660, 1719, 1670, 1766] }, { id: 'w_dinS2', r: [1660, 1708, 1752, 1719] },
  { id: 'w_dinE', r: [1731, 1606, 1752, 1708] },
  { id: 'w_foyS1', r: [1752, 1624, 1771, 1634] }, { id: 'w_foyJ1', r: [1820, 1624, 1840, 1634] }, { id: 'w_foyJ2', r: [2008, 1624, 2025, 1634] }, { id: 'w_foyS2', r: [2079, 1624, 2096, 1634] },
  // bedroom wing
  { id: 'w_bnW', r: [2107, 393, 2118, 746] }, { id: 'w_bnN1', r: [2107, 393, 2210, 403] }, { id: 'w_bnN2', r: [2347, 393, 2448, 403] },
  { id: 'w_bnE1', r: [2437, 403, 2448, 610] }, { id: 'w_bnE2', r: [2437, 700, 2448, 746] },
  { id: 'w_bnS1', r: [2209, 746, 2297, 757] }, { id: 'w_bnS2', r: [2411, 746, 2475, 757] }, { id: 'w_bnS3', r: [2575, 746, 2598, 757] },
  { id: 'w_baN1', r: [2448, 520, 2493, 530] }, { id: 'w_baN2', r: [2546, 520, 2598, 530] },
  { id: 'w_E1', r: [2587, 530, 2598, 880] }, { id: 'w_E2', r: [2587, 946, 2598, 1072] }, { id: 'w_E3', r: [2587, 1145, 2598, 1234] },
  { id: 'w_lin1', r: [2222, 757, 2232, 779] }, { id: 'w_lin2', r: [2222, 833, 2232, 865] }, { id: 'w_lin3', r: [2287, 757, 2297, 865] },
  { id: 'w_desk', r: [2297, 801, 2411, 812] }, { id: 'w_wicW', r: [2411, 757, 2422, 865] },
  { id: 'w_bmN1', r: [2184, 853, 2297, 874] }, { id: 'w_bmN2', r: [2411, 853, 2598, 865] },
  { id: 'w_bmS1', r: [2184, 1152, 2195, 1163] }, { id: 'w_bmS2', r: [2262, 1152, 2305, 1163] }, { id: 'w_bmS3', r: [2385, 1152, 2492, 1163] }, { id: 'w_bmS4', r: [2546, 1152, 2598, 1163] },
  { id: 'w_linE1', r: [2107, 1234, 2130, 1244] }, { id: 'w_linE2', r: [2184, 1163, 2195, 1244] },
  { id: 'w_drW', r: [2270, 1163, 2281, 1331] },
  { id: 'w_drE1', r: [2437, 1163, 2448, 1262] }, { id: 'w_drE2', r: [2437, 1323, 2448, 1469] }, { id: 'w_drE3', r: [2437, 1523, 2448, 1719] },
  { id: 'w_baFN', r: [2448, 1234, 2628, 1262] }, { id: 'w_baFE1', r: [2617, 1262, 2628, 1307] }, { id: 'w_baFE2', r: [2617, 1359, 2628, 1402] },
  { id: 'w_baFS', r: [2448, 1402, 2628, 1427] },
  { id: 'w_wfE', r: [2588, 1427, 2599, 1574] }, { id: 'w_wfS', r: [2448, 1564, 2599, 1574] },
  { id: 'w_bfN2', r: [2262, 1331, 2300, 1343] }, { id: 'w_bfN3', r: [2380, 1331, 2437, 1343] },
  { id: 'w_bfW', r: [2096, 1343, 2119, 1719] },
  { id: 'w_bfS1', r: [2096, 1708, 2188, 1719] }, { id: 'w_bfBay1', r: [2177, 1719, 2188, 1766] }, { id: 'w_bfBay2', r: [2188, 1756, 2210, 1766] },
  { id: 'w_bfBay3', r: [2347, 1756, 2367, 1766] }, { id: 'w_bfBay4', r: [2367, 1719, 2378, 1766] }, { id: 'w_bfS2', r: [2367, 1708, 2448, 1719] },
].filter((w) => w.r[2] > w.r[0] && w.r[3] > w.r[1]);

// ---------------------------------------------------------------- openings
// type: window | door | pocket | barn | cased | slider | french | entry | sidelight | garage
// sill/head in ft above the floor; top = wall top (ft) above the opening. into = room the leaf swings into.
// hinge: 'a' = low-coordinate end, 'b' = high-coordinate end. grid = [cols, rows] of glass lites.
export const openings = [
  // master wing
  { id: 'win_mstr_n1', type: 'window', r: [704, 153, 771, 163], sill: 1.5, head: 8, grid: [2, 2], owner: 'master_suite' },
  { id: 'win_mstr_n2', type: 'window', r: [985, 153, 1052, 163], sill: 1.5, head: 8, grid: [2, 2], owner: 'master_suite' },
  { id: 'door_mstr_slider', type: 'slider', r: [1080, 429, 1091, 595], head: 8, owner: 'master_suite' },
  { id: 'win_tub', type: 'window', r: [381, 423, 392, 532], sill: 3, head: 8, grid: [2, 2], owner: 'master_suite' },
  { id: 'door_barn', type: 'barn', r: [664, 436, 674, 519], head: 8, into: 'mstr', owner: 'master_suite' },
  { id: 'door_wic_top', type: 'door', r: [507, 274, 567, 284], head: 8, into: 'mbath', hinge: 'a', owner: 'master_suite' },
  { id: 'door_wc', type: 'door', r: [563, 546, 574, 620], head: 8, into: 'wc', hinge: 'a', owner: 'master_suite' },
  { id: 'door_mbath_wic', type: 'door', r: [486, 699, 566, 709], head: 8, into: 'wic_mstr', hinge: 'a', owner: 'master_suite' },
  { id: 'door_mstr', type: 'door', r: [983, 632, 1060, 643], head: 8, into: 'mstr', hinge: 'b', owner: 'master_suite' },
  { id: 'door_wic_util', type: 'door', r: [664, 724, 674, 793], head: 8, into: 'util', hinge: 'b', owner: 'rest' },
  { id: 'door_util', type: 'door', r: [972, 720, 983, 790], head: 8, into: 'util', hinge: 'b', owner: 'rest' },
  { id: 'door_pdr', type: 'door', r: [912, 910, 923, 984], head: 7, into: 'pdr', hinge: 'a', owner: 'rest' },
  { id: 'door_garage_mud', type: 'door', r: [938, 1152, 1011, 1166], head: 7, into: 'mud', hinge: 'b', exterior: true, owner: 'rest' },
  { id: 'open_hall_kitchen', type: 'cased', r: [1080, 848, 1091, 931], head: 8, owner: 'great_room' },
  { id: 'door_garage', type: 'garage', r: [381, 1250, 392, 1700], head: 8, owner: 'rest' },
  { id: 'win_garage_front', type: 'window', r: [548, 1784, 614, 1795], sill: 3, head: 8, grid: [2, 3], owner: 'exterior' },
  { id: 'win_garage_bay', type: 'window', r: [852, 1888, 989, 1898], sill: 2.5, head: 8, grid: [4, 3], owner: 'exterior' },
  // kitchen / great room
  { id: 'win_kitchen', type: 'window', r: [1191, 746, 1357, 757], sill: 3.5, head: 8, grid: [4, 2], owner: 'great_room' },
  { id: 'door_french1', type: 'french', r: [1511, 746, 1679, 757], head: 8, top: GR, owner: 'great_room' },
  { id: 'door_french2', type: 'french', r: [1709, 746, 1877, 757], head: 8, top: GR, owner: 'great_room' },
  { id: 'door_french3', type: 'french', r: [1907, 746, 2075, 757], head: 8, top: GR, owner: 'great_room' },
  { id: 'open_butler', type: 'cased', r: [1163, 1331, 1230, 1342], head: 8, owner: 'great_room' },
  { id: 'open_dining_butler', type: 'cased', r: [1395, 1450, 1410, 1518], head: 8, owner: 'great_room' },
  { id: 'open_dining', type: 'cased', r: [1497, 1331, 1711, 1352], head: 8, top: GR, beam: true, owner: 'great_room' },
  { id: 'open_foyer', type: 'cased', r: [1774, 1331, 2076, 1352], head: 8, top: GR, beam: true, owner: 'great_room' },
  { id: 'open_great_vest', type: 'cased', r: [2107, 757, 2118, 853], head: 8, top: GR, owner: 'great_room' },
  { id: 'open_great_hall', type: 'cased', r: [2107, 1254, 2118, 1323], head: 8, top: GR, owner: 'great_room' },
  { id: 'win_butler1', type: 'window', r: [1139, 1564, 1193, 1574], sill: 3.5, head: 8, grid: [2, 3], owner: 'exterior' },
  { id: 'win_butler2', type: 'window', r: [1300, 1564, 1353, 1574], sill: 3.5, head: 8, grid: [2, 3], owner: 'exterior' },
  { id: 'win_dining_bay', type: 'window', r: [1503, 1756, 1640, 1766], sill: 1.5, head: 8, grid: [4, 3], owner: 'exterior' },
  { id: 'sidelight_l', type: 'sidelight', r: [1771, 1624, 1820, 1634], sill: 0, head: 8, grid: [1, 3], owner: 'exterior' },
  { id: 'door_entry', type: 'entry', r: [1840, 1624, 2008, 1634], head: 8, into: 'foyer', owner: 'exterior' },
  { id: 'sidelight_r', type: 'sidelight', r: [2025, 1624, 2079, 1634], sill: 0, head: 8, grid: [1, 3], owner: 'exterior' },
  // bedroom wing
  { id: 'win_bed_ne', type: 'window', r: [2210, 393, 2347, 403], sill: 2, head: 7.5, grid: [4, 3], owner: 'rest' },
  { id: 'win_bath_ne', type: 'window', r: [2493, 520, 2546, 530], sill: 5, head: 7, grid: [2, 1], owner: 'rest' },
  { id: 'door_bed_ne', type: 'door', r: [2140, 746, 2209, 757], head: 7, into: 'bed_ne', hinge: 'a', owner: 'rest' },
  { id: 'door_linen_ne', type: 'door', r: [2222, 779, 2232, 833], head: 7, into: 'linen_ne', hinge: 'b', owner: 'rest' },
  { id: 'door_bath_ne', type: 'pocket', r: [2437, 610, 2448, 700], head: 7, owner: 'rest' },
  { id: 'door_wic_ne', type: 'pocket', r: [2475, 746, 2575, 757], head: 7, owner: 'rest' },
  { id: 'win_bed_mid1', type: 'window', r: [2587, 880, 2598, 946], sill: 2, head: 7.5, grid: [2, 3], owner: 'rest' },
  { id: 'win_bed_mid2', type: 'window', r: [2587, 1072, 2598, 1145], sill: 2, head: 7.5, grid: [2, 3], owner: 'rest' },
  { id: 'door_bed_mid', type: 'door', r: [2195, 1152, 2262, 1163], head: 7, into: 'bed_mid', hinge: 'a', owner: 'rest' },
  { id: 'door_dress_n', type: 'pocket', r: [2305, 1152, 2385, 1163], head: 7, owner: 'rest' },
  { id: 'door_wic_mid', type: 'door', r: [2492, 1152, 2546, 1163], head: 7, into: 'bed_mid', hinge: 'b', owner: 'rest' },
  { id: 'door_linen_e', type: 'door', r: [2130, 1234, 2184, 1244], head: 7, into: 'hall_e', hinge: 'a', owner: 'rest' },
  { id: 'door_bath_front', type: 'door', r: [2437, 1262, 2448, 1323], head: 7, into: 'bath_front', hinge: 'b', owner: 'rest' },
  { id: 'win_bath_front', type: 'window', r: [2617, 1307, 2628, 1359], sill: 4, head: 7, grid: [2, 1], owner: 'rest' },
  { id: 'door_wic_front', type: 'door', r: [2437, 1469, 2448, 1523], head: 7, into: 'bed_front', hinge: 'a', owner: 'rest' },
  { id: 'door_bed_front', type: 'door', r: [2193, 1331, 2262, 1343], head: 7, into: 'bed_front', hinge: 'a', owner: 'rest' },
  { id: 'door_dress_s', type: 'pocket', r: [2300, 1331, 2380, 1343], head: 7, owner: 'rest' },
  { id: 'win_bed_front_bay', type: 'window', r: [2210, 1756, 2347, 1766], sill: 1.5, head: 8, grid: [4, 3], owner: 'exterior' },
];

// Fixed points that pieces may want (px). Back-porch posts traced from the plan.
export const marks = {
  porchPosts: [[1458, 393, 1478, 413], [1781, 393, 1801, 413]],
  entryColumns: [[1802, 1707, 1827, 1732], [2020, 1707, 2042, 1732]],
  entrySteps: [1775, 1732, 2077, 1790],
  island: [1260, 945, 1430, 1199],          // 6'x9' kitchen island
  islandSink: [1335, 1160, 1360, 1185],
  range: [1091, 1020, 1150, 1121],          // 36" range on kitchen west wall
  ovenTower: [1091, 1196, 1150, 1282],      // oven / microwave tall cabinet
  fridge: [1307, 1331, 1398, 1392],         // built-in fridge in the niche
  sinkKitchen: [1230, 757, 1320, 800],      // under the kitchen window
  fireplace: { firebox: [2084, 1010, 2107, 1100], hearth: [2040, 990, 2107, 1150] },
  shower: [565, 284, 664, 420],             // 42x56 shower
  tubMaster: [400, 405, 470, 550],          // freestanding 5' tub
  vanityMasterN: [392, 285, 445, 400], vanityMasterS: [392, 555, 445, 700],
  stairUp: [780, 813, 950, 899], stairDown: [772, 1065, 923, 1152], stairLanding: [674, 813, 761, 1152],
};
