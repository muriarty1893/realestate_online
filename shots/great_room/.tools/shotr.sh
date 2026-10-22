#!/bin/bash
# retrying wrapper: shotr.sh name [args]
T=/home/murat/Desktop/floor_plan/shots/great_room/.tools
for i in 1 2 3 4 5 6; do
  out=$($T/shot.sh "$@" 2>&1)
  if ! echo "$out" | grep -q "SHOT FAILED"; then echo "$out" | grep -v Traceback | grep -v '^  ' | grep -v FileNotFound; exit 0; fi
  echo "attempt $i failed: $(echo "$out" | grep 'SHOT FAILED' | head -1)"
  sleep 15
done
exit 1
