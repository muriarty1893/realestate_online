#!/usr/bin/env bash
# Blind A/B pair for a critic: our shot and the reference photo, in random order, at the photo's size, PNG, metadata stripped.
#   CRITIC_DIR=<dir> tools/critic_pair.sh <round> <piece> <ours.png> <ref.webp>
# Prints "<pair dir> A=<ours|photo>". The answer key goes to $CRITIC_DIR/keys/pairs.txt; keep the critic away from it.
set -e
S=${CRITIC_DIR:?set CRITIC_DIR to a scratch directory}
r=$1; piece=$2; ours=$3; ref=$4
d=$S/critic/$(head -c6 /dev/urandom | od -An -tx1 | tr -d ' \n'); mkdir -p $d $S/keys
read W H < <(magick identify -format '%w %h\n' "$ref")
if (( RANDOM % 2 )); then a=ours; else a=photo; fi
if [ $a = ours ]; then A="$ours"; B="$ref"; else A="$ref"; B="$ours"; fi
magick "$A" -strip -resize ${W}x${H}! PNG24:$d/A.png
magick "$B" -strip -resize ${W}x${H}! PNG24:$d/B.png
echo "$r $piece $d A=$a" >> $S/keys/pairs.txt
echo "$d A=$a"
