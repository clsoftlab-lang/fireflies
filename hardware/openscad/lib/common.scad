// SPDX-License-Identifier: CERN-OHL-P-2.0
// SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
//
// common.scad — shared helpers for the Fireflies dispenser + jellyfish carrier.
// Everything is parametric and sized to print on a 220 x 220 x 250 mm bed.

// Rendering quality (override before include if you want faster previews).
$fn = $preview ? 32 : 64;

EPS = 0.01;          // small overlap to avoid coincident-face artefacts
WALL = 2.4;          // default wall thickness (3 perimeters @ 0.8 nozzle-ish)
M3_CLEAR = 3.4;      // clearance hole for an M3 screw
M3_TAP = 2.9;        // self-tap pilot for an M3 into plastic
M3_HEAD = 6.2;       // M3 cap-head diameter
BED = [220, 220, 250]; // reference print bed (X, Y, Z)

// A box with rounded vertical edges, sitting on the XY plane.
module rounded_box(size, r=3, center=false) {
    w = size[0]; d = size[1]; h = size[2];
    rr = min(r, w/2 - EPS, d/2 - EPS);
    dx = center ? -w/2 : 0;
    dy = center ? -d/2 : 0;
    translate([dx, dy, 0])
    linear_extrude(height=h)
        offset(r=rr) offset(delta=-rr)
            square([w, d]);
}

// Hollow tray: outer rounded box minus an inner cavity, leaving a floor + walls.
module tray(size, wall=WALL, r=3, floor=WALL) {
    w = size[0]; d = size[1]; h = size[2];
    difference() {
        rounded_box([w, d, h], r);
        translate([wall, wall, floor])
            rounded_box([w - 2*wall, d - 2*wall, h - floor + EPS], max(0.5, r-wall));
    }
}

// Vertical through-hole (for screws / posts) at [x, y].
module vhole(d, h, x=0, y=0) {
    translate([x, y, -EPS])
        cylinder(d=d, h=h + 2*EPS);
}

// A short boss with an M3 tap pilot, for screwing parts together.
module screw_boss(h, x=0, y=0, od=M3_HEAD, id=M3_TAP) {
    translate([x, y, 0]) difference() {
        cylinder(d=od, h=h);
        translate([0, 0, 1]) cylinder(d=id, h=h);
    }
}

// Four mounting holes inset from the corners of a w x d footprint.
module corner_holes(w, d, inset=6, dia=M3_CLEAR, h=WALL*3) {
    for (sx = [inset, w-inset], sy = [inset, d-inset])
        vhole(dia, h, sx, sy);
}

// A semicircular cable / tube channel (open groove) of given radius and length,
// running along +X. Subtract it from a block.
module tube_channel(r, len) {
    rotate([0, 90, 0]) cylinder(r=r, h=len);
}

// Reports whether a bounding size fits the bed (informational echo).
module assert_fits(size) {
    ok = size[0] <= BED[0] && size[1] <= BED[1] && size[2] <= BED[2];
    echo(str("part size ", size, ok ? " FITS bed " : " EXCEEDS bed ", BED));
}
