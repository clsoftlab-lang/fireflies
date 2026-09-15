// SPDX-License-Identifier: CERN-OHL-P-2.0
// SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
//
// dispenser_frame.scad — base plate + upright back panel for the desktop dispenser.
// The other modules (magazine, gate, valve mount, load-cell mount, LED jig, tray)
// bolt onto this. Prints as a flat base with a low back wall (fits the bed upright
// or laid down).

include <lib/common.scad>

FRAME_W   = 190;   // X footprint
FRAME_D   = 120;   // Y footprint
BASE_T    = 5;     // base plate thickness
BACK_H    = 140;   // upright back-panel height
BACK_T    = 5;     // back-panel thickness
RIB_T     = 4;     // gusset ribs

module dispenser_frame() {
    // base plate
    difference() {
        rounded_box([FRAME_W, FRAME_D, BASE_T], r=6);
        // mounting grid for modules (M3 clearance holes)
        for (x = [20:30:FRAME_W-20], y = [20:30:FRAME_D-20])
            vhole(M3_CLEAR, BASE_T, x, y);
        // helium-line pass-through near the back-left
        translate([28, FRAME_D-18, -EPS]) cylinder(d=10, h=BASE_T+2*EPS);
    }

    // upright back panel along the +Y edge
    translate([0, FRAME_D-BACK_T, 0])
    difference() {
        rounded_box([FRAME_W, BACK_T, BACK_H], r=4);
        // cable window
        translate([FRAME_W/2-25, -EPS, 40]) cube([50, BACK_T+2*EPS, 60]);
        // fixing holes for the electronics tray on the back panel
        for (x = [30, FRAME_W-30], z = [20, BACK_H-20])
            translate([x, BACK_T+EPS, z]) rotate([90,0,0]) cylinder(d=M3_TAP, h=BACK_T+2*EPS);
    }

    // two triangular gusset ribs so the tall panel does not fold over.
    // rotate([90,0,90]) maps the 2D triangle's local (x,y) onto world (Y,Z) with
    // thickness along +X; -40 in local-x runs the brace forward onto the base.
    for (x = [14, FRAME_W-14-RIB_T])
        translate([x, FRAME_D-BACK_T, BASE_T])
            rotate([90, 0, 90])
            linear_extrude(RIB_T)
                polygon([[0,0],[-40,0],[0,60]]);
}

assert_fits([FRAME_W, FRAME_D, BACK_H]);
dispenser_frame();
