// SPDX-License-Identifier: CERN-OHL-P-2.0
// SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
//
// led_test_jig.scad — a small dark hood that faces a photodiode at the just-armed
// unit. The dispenser blinks the unit once; the photodiode confirms the flash so no
// dead unit is ever released (spec §4 stage 3). A shroud keeps ambient light out.

include <lib/common.scad>

HOOD_D   = 34;    // inner diameter of the viewing hood
HOOD_LEN = 30;    // depth of the hood
DIODE_D  = 5.2;   // 5 mm photodiode
BASE_W = 56; BASE_D = 48; BASE_T = 5;

module led_test_jig() {
    // base with corner fixing holes and a light-hole under the hood so the unit's
    // flash (from a unit held just below) reaches the shrouded photodiode.
    difference() {
        rounded_box([BASE_W, BASE_D, BASE_T], r=4);
        corner_holes(BASE_W, BASE_D, inset=6, h=BASE_T*2);
        translate([BASE_W/2, BASE_D/2, -EPS]) cylinder(d=HOOD_D-4, h=BASE_T+2*EPS);
    }
    // VERTICAL hood: wide open mouth resting on the base, narrowing upward, with the
    // photodiode bore at the top apex. Flat-bottomed => prints without supports and
    // never dips below the bed. The shroud keeps ambient light off the diode.
    translate([BASE_W/2, BASE_D/2, BASE_T-EPS])
    difference() {
        cylinder(d1=HOOD_D+2*WALL, d2=HOOD_D*0.45+2*WALL, h=HOOD_LEN);
        translate([0,0,-EPS])
            cylinder(d1=HOOD_D, d2=HOOD_D*0.45, h=HOOD_LEN-WALL);
        translate([0,0,HOOD_LEN-WALL-EPS]) cylinder(d=DIODE_D, h=WALL+2*EPS);
    }
}

assert_fits([BASE_W, BASE_D, HOOD_LEN + BASE_T]);
led_test_jig();
