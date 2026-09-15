// SPDX-License-Identifier: CERN-OHL-P-2.0
// SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
//
// electronics_tray.scad — holds the Raspberry Pi Pico (or Arduino Nano) and the
// HX711 load-cell amp, with cable exits. Bolts to the frame's back panel.

include <lib/common.scad>

PICO = [21.0, 51.0];   // Pico board X,Y
HX711 = [16.0, 24.0];  // HX711 breakout board X,Y
POST_H = 7;            // standoff height
TRAY_W = 100; TRAY_D = 70; TRAY_H = 12;

module board_posts(pos, board, pitch_inset=2) {
    // four standoff posts for a board of size `board` with a tap pilot
    bx = board[0]; by = board[1];
    for (x = [pitch_inset, bx - pitch_inset], y = [pitch_inset, by - pitch_inset])
        translate([pos[0] + x, pos[1] + y, WALL])
            screw_boss(POST_H, 0, 0, od=5.5, id=2.4);
}

module electronics_tray() {
    difference() {
        tray([TRAY_W, TRAY_D, TRAY_H], wall=WALL, r=4, floor=WALL);
        // cable exit windows on two sides
        translate([TRAY_W/2-14, -EPS, WALL+2]) cube([28, WALL+2*EPS, TRAY_H]);
        translate([-EPS, TRAY_D/2-10, WALL+2]) cube([WALL+2*EPS, 20, TRAY_H]);
        // holes to bolt the tray onto the back panel
        for (x = [16, TRAY_W-16])
            translate([x, TRAY_D-WALL/2, TRAY_H/2]) rotate([90,0,0]) cylinder(d=M3_CLEAR, h=WALL*2, center=true);
    }
    // board standoffs
    board_posts([10, 8], PICO);
    board_posts([TRAY_W - HX711[0] - 12, 8], HX711);
}

assert_fits([TRAY_W, TRAY_D, TRAY_H + POST_H]);
electronics_tray();
