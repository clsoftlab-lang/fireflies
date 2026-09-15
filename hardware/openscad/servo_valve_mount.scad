// SPDX-License-Identifier: CERN-OHL-P-2.0
// SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
//
// servo_valve_mount.scad — holds a 9g micro-servo whose horn pinches the soft
// helium tube against an anvil (a pinch valve). The buoyancy loop opens/closes this
// to meter helium (spec §4, F2). No high-pressure parts here: it pinches a low-
// pressure silicone line downstream of the regulator.

include <lib/common.scad>

SERVO_L = 23.0;   // SG90-class body length
SERVO_W = 12.6;   // body width
SERVO_H = 22.0;   // body height (below flange)
FLANGE  = 32.5;   // tab-to-tab length
TUBE_OD = 6.0;    // silicone helium tube outer diameter

BASE_W = 70; BASE_D = 46; BASE_T = 5;

module servo_valve_mount() {
    difference() {
        union() {
            rounded_box([BASE_W, BASE_D, BASE_T], r=4);
            // servo pocket walls
            translate([8, BASE_D/2 - SERVO_W/2 - WALL, 0])
                rounded_box([SERVO_L + 2*WALL, SERVO_W + 2*WALL, SERVO_H*0.6], r=2);
            // anvil block the tube is pinched against
            translate([8 + SERVO_L + 8, BASE_D/2 - 8, 0])
                rounded_box([12, 16, 20], r=2);
        }
        // servo body cavity
        translate([8+WALL, BASE_D/2 - SERVO_W/2, BASE_T])
            cube([SERVO_L, SERVO_W, SERVO_H]);
        // servo flange screw holes
        for (dx = [8+WALL - 2, 8+WALL + SERVO_L + 2])
            translate([dx, BASE_D/2, -EPS]) cylinder(d=2.4, h=BASE_T+2*EPS);
        // tube groove across the anvil so the horn can pinch it
        translate([8 + SERVO_L + 6, BASE_D/2, 12])
            rotate([0,90,0]) cylinder(d=TUBE_OD, h=20);
        // fixing feet to the frame
        corner_holes(BASE_W, BASE_D, inset=6, h=BASE_T*2);
    }
}

assert_fits([BASE_W, BASE_D, SERVO_H*0.6]);
servo_valve_mount();
