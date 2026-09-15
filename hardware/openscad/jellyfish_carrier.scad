// SPDX-License-Identifier: CERN-OHL-P-2.0
// SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
//
// jellyfish_carrier.scad — the ONLY printed part that flies. A feather-light ring
// that hangs under the helium bell: the LED/MCU pad sits at the hub, and the 3-8
// glowing tendrils clip to eyelets around the rim (spec §3.1). Every milligram here
// eats into the balloon's free lift, so it is a thin, skeletal ring — print it in the
// lightest material you have (ideally a compostable/cellulose-loaded filament for
// leave-no-trace, spec §7). Diameter is small on purpose.

include <lib/common.scad>

RING_OD   = 24;    // outer diameter of the ring (small!)
RING_ID   = 18;    // inner diameter (open centre keeps it light)
RING_T    = 1.2;   // thin vertical thickness
N_TENDRIL = 6;     // eyelets around the rim (spec: 3-8)
EYELET_D  = 1.6;   // hole the tendril thread passes through
HUB_D     = 7;     // central pad for the micro-LED / ATtiny board
SPOKE_W   = 1.4;   // thin spokes joining hub to ring

module jellyfish_carrier(n=N_TENDRIL) {
    $fn = 48;
    // outer ring
    linear_extrude(RING_T)
        difference() {
            circle(d=RING_OD);
            circle(d=RING_ID);
        }
    // central hub pad with a tiny cable slot
    linear_extrude(RING_T) difference() {
        circle(d=HUB_D);
        circle(d=HUB_D-2*0.8);   // hollow to save mass, leaving a thin annulus
    }
    // three light spokes tying hub to ring
    for (a = [0:120:359])
        rotate([0,0,a])
            translate([0, -SPOKE_W/2, 0])
                cube([RING_OD/2, SPOKE_W, RING_T]);
    // tendril eyelets: little tabs on the rim, each with a thread hole
    for (i = [0:n-1]) {
        a = i * 360/n;
        rotate([0,0,a]) translate([RING_OD/2 - 0.5, 0, 0]) {
            linear_extrude(RING_T)
                difference() {
                    translate([1.5,0]) circle(d=3.4);
                    translate([1.8,0]) circle(d=EYELET_D);
                }
        }
    }
}

assert_fits([RING_OD+4, RING_OD+4, RING_T]);
jellyfish_carrier();
