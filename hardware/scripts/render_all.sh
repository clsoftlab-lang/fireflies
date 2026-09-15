#!/usr/bin/env bash
# SPDX-License-Identifier: CERN-OHL-P-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
#
# render_all.sh — export every dispenser/jellyfish part to STL + a preview PNG.
# STLs -> hardware/stl/ , PNGs -> hardware/renders/
set -euo pipefail

# OpenSCAD location (override by exporting OPENSCAD before running).
: "${OPENSCAD:=/c/Program Files/OpenSCAD/openscad.com}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HW="$(cd "$HERE/.." && pwd)"
SCAD_DIR="$HW/openscad"
STL_DIR="$HW/stl"
PNG_DIR="$HW/renders"
mkdir -p "$STL_DIR" "$PNG_DIR"

echo "OpenSCAD: $OPENSCAD"
"$OPENSCAD" --version 2>&1 || { echo "OpenSCAD not found at $OPENSCAD"; exit 1; }

shopt -s nullglob
for f in "$SCAD_DIR"/*.scad; do
  name="$(basename "$f" .scad)"
  echo "=== $name ==="
  "$OPENSCAD" -o "$STL_DIR/$name.stl" "$f"
  "$OPENSCAD" -o "$PNG_DIR/$name.png" \
      --imgsize=900,700 --autocenter --viewall --render \
      --colorscheme=Tomorrow "$f"
done
echo "Done. STLs in $STL_DIR , PNGs in $PNG_DIR"
