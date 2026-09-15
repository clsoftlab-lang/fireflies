// SPDX-License-Identifier: CERN-OHL-P-2.0
// SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
//
// release_gate.scad — a servo-driven sliding gate that holds a finished, trimmed,
// LED-tested jellyfish and lets exactly one go on the "release" command (spec §4).
// Two printed parts kept side by side on the plate: the gate housing and the slider.

include <lib/common.scad>

GATE_W  = 80;   // X
GATE_D  = 50;   // Y
GATE_H  = 26;   // Z
BORE    = 26;   // diameter of the hold-through opening for the balloon neck/tether
SLIDE_T = 6;    // slider thickness

module gate_housing() {
    difference() {
        rounded_box([GATE_W, GATE_D, GATE_H], r=4);
        // the through-bore the unit sits in until released
        translate([GATE_W*0.32, GATE_D/2, -EPS])
            cylinder(d=BORE, h=GATE_H+2*EPS);
        // slot the slider rides in
        translate([WALL, GATE_D/2 - SLIDE_T/2 - 0.4, GATE_H-SLIDE_T-2])
            cube([GATE_W-2*WALL+EPS, SLIDE_T+0.8, SLIDE_T+0.6]);
        // servo horn clearance + mount holes on the +X end
        translate([GATE_W-14, GATE_D/2, GATE_H-6])
            for (dx=[-6,6]) translate([dx,0,-GATE_H]) cylinder(d=M3_TAP, h=GATE_H);
        // fixing feet
        corner_holes(GATE_W, GATE_D, inset=7, h=WALL*3);
    }
}

module gate_slider() {
    // a flat tongue that slides across the bore to block/free it, with a slot
    // for the servo horn pin
    difference() {
        union() {
            rounded_box([GATE_W-8, SLIDE_T, SLIDE_T], r=2);
            // blocking paddle
            translate([GATE_W*0.30, 0, 0])
                rounded_box([BORE+8, SLIDE_T, SLIDE_T], r=2);
        }
        translate([GATE_W-18, SLIDE_T/2, -EPS]) cylinder(d=2.6, h=SLIDE_T+2*EPS);
    }
}

// lay both parts on the plate, not overlapping
module release_gate() {
    gate_housing();
    translate([0, GATE_D + 12, 0]) gate_slider();
}

assert_fits([GATE_W, GATE_D + 12 + SLIDE_T, GATE_H]);
release_gate();
