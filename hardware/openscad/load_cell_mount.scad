// SPDX-License-Identifier: CERN-OHL-P-2.0
// SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
//
// load_cell_mount.scad — clamps a small straight-bar load cell (e.g. 100 g range).
// The balloon tethers to the free end; the cell reads its upward pull = free lift,
// which the buoyancy loop trims to near-neutral (spec §4, F2). A tiny load cell +
// HX711 gives sub-0.1 g resolution, which is what "near-neutral" needs.

include <lib/common.scad>

CELL_L = 80;    // bar load cell length
CELL_W = 12.7;  // bar width
CELL_H = 12.7;  // bar height
CELL_HOLE = 5;  // M5-ish mounting holes (typical for these cells)
CELL_PITCH = 15;// hole spacing from each end

BASE_W = 110; BASE_D = 40; BASE_T = 6; POST_H = 22;

module load_cell_mount() {
    // fixed-end clamp block (bolts the cell down at one end)
    difference() {
        rounded_box([BASE_W, BASE_D, BASE_T], r=5);
        corner_holes(BASE_W, BASE_D, inset=6, h=BASE_T*2);
    }
    // clamp post at the fixed end with the two load-cell bolt holes
    translate([10, BASE_D/2 - CELL_W/2 - WALL, BASE_T])
    difference() {
        rounded_box([24, CELL_W + 2*WALL, POST_H], r=2);
        // channel for the bar
        translate([-EPS, WALL, POST_H-CELL_H])
            cube([24+2*EPS, CELL_W, CELL_H+EPS]);
        // the two fixed-end bolt holes through the bar
        for (x = [CELL_PITCH*0.4, CELL_PITCH])
            translate([x+4, (CELL_W+2*WALL)/2, POST_H-CELL_H-4])
                cylinder(d=CELL_HOLE, h=CELL_H+8);
    }
    // Free-end tether platform — a SEPARATE printed piece (a bar load cell must be
    // free to flex, so this must NOT be rigidly joined to the fixed base). It bolts
    // to the cell's moving end; the balloon tethers to its eye. Laid off to the side
    // on the plate so it prints as its own solid.
    translate([BASE_W + 10, BASE_D/2 - 12, 0]) {
        difference() {
            rounded_box([28, 24, BASE_T], r=3);
            // bolt holes to the cell's free end
            for (x = [6, 22]) vhole(CELL_HOLE, BASE_T, x, 12);
        }
        // a small upstand with a tether eye
        translate([14, 12, BASE_T]) difference() {
            cylinder(d=8, h=14);
            translate([0,0,9]) rotate([90,0,0]) cylinder(d=3, h=20, center=true);
        }
    }
}

assert_fits([BASE_W + 10 + 28, BASE_D, POST_H + BASE_T]);
load_cell_mount();
