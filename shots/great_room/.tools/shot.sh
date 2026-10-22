#!/bin/bash
# usage: shot.sh name [extra shot args]
T=/home/murat/Desktop/floor_plan/shots/great_room/.tools
cd /home/murat/Desktop/floor_plan
n=$1; shift
node tools/shot.mjs --view great_room --out shots/great_room/$n.png --compare refs/inside_view_1.webp "$@" 2>&1 | grep -v 'cmp.png' | tail -12
$T/venv/bin/python $T/overlay.py shots/great_room/$n.png $T/ov_$n.png edges $T/gr_ref.png
