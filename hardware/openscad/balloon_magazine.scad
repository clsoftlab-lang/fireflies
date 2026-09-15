// SPDX-License-Identifier: CERN-OHL-P-2.0
// SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
//
// balloon_magazine.scad — holds a stack of empty (un-inflated) envelopes and feeds
// one at a time to the fill station. Empty micro-balloons are flat, so the magazine
// is a slotted comb the flat envelopes drop through, plus a gently sloped floor so
// the next one presents to the loader.

include <lib/common.scad>

MAG_W     = 90;    // X
MAG_D     = 70;    // Y (feed direction)
MAG_H     = 60;    // Z stack height
SLOT_W    = 3.0;   // width of each envelope slot
SLOT_N    = 12;    // number of slots (capacity guide)
FLOOR_SLOPE = 10;  // deg, so envelopes slide toward the exit

module balloon_magazine() {
    difference() {
        // outer shell, open top and open exit face (+Y)
        difference() {
            rounded_box([MAG_W, MAG_D, MAG_H], r=4);
            translate([WALL, WALL, WALL])
                rounded_box([MAG_W-2*WALL, MAG_D-2*WALL, MAG_H], r=2);
            // open the exit face
            translate([WALL*2, MAG_D-WALL-EPS, WALL*2])
                cube([MAG_W-4*WALL, WALL+2*EPS, MAG_H]);
        }
        // sloped floor to urge the stack forward
        translate([-EPS, -EPS, 0])
            rotate([FLOOR_SLOPE, 0, 0])
                cube([MAG_W+2*EPS, MAG_D+20, WALL]);
    }

    // comb of dividers that keep flat envelopes separated so they feed singly
    for (i = [1:SLOT_N])
        translate([MAG_W/2 - (SLOT_N/2)*(SLOT_W+1.2) + i*(SLOT_W+1.2), WALL, WALL])
            cube([1.2, MAG_D-2*WALL-6, MAG_H*0.5]);

    // feet with clearance holes to bolt to the frame grid
    for (x = [10, MAG_W-10], y = [10, MAG_D-16])
        translate([x, y, 0]) difference() {
            cylinder(d=10, h=WALL);
            vhole(M3_CLEAR, WALL, 0, 0);
        }
}

assert_fits([MAG_W, MAG_D, MAG_H]);
balloon_magazine();
