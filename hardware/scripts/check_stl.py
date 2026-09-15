#!/usr/bin/env python3
# SPDX-License-Identifier: CERN-OHL-P-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
"""check_stl.py — verify every exported STL is non-empty and fits the print bed.

Parses ASCII or binary STL, counts triangles, computes the axis-aligned bounding
box, and checks it against the reference 220 x 220 x 250 mm bed. Exits non-zero if
any part is empty or too big.
"""
from __future__ import annotations

import struct
import sys
from pathlib import Path

BED = (220.0, 220.0, 250.0)  # X, Y, Z mm


def _read_binary(data: bytes):
    n = struct.unpack_from("<I", data, 80)[0]
    tris = []
    off = 84
    for _ in range(n):
        # normal(3f) + 3 vertices(3f each) + attr(H) = 50 bytes
        vals = struct.unpack_from("<12fH", data, off)
        v = vals[3:12]
        tris.append(((v[0], v[1], v[2]), (v[3], v[4], v[5]), (v[6], v[7], v[8])))
        off += 50
    return tris


def _read_ascii(text: str):
    tris = []
    cur = []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("vertex"):
            _, x, y, z = line.split()[:4]
            cur.append((float(x), float(y), float(z)))
            if len(cur) == 3:
                tris.append(tuple(cur))
                cur = []
    return tris


def load_triangles(path: Path):
    data = path.read_bytes()
    # ASCII STL starts with "solid" and contains "facet"; binary is 84 + 50n bytes.
    is_ascii = data[:5].lower() == b"solid" and b"facet" in data[:2000]
    if is_ascii:
        try:
            return _read_ascii(data.decode("utf-8", "ignore"))
        except Exception:
            return _read_binary(data)
    return _read_binary(data)


def bbox(tris):
    xs = [v[0] for t in tris for v in t]
    ys = [v[1] for t in tris for v in t]
    zs = [v[2] for t in tris for v in t]
    return (
        (min(xs), min(ys), min(zs)),
        (max(xs), max(ys), max(zs)),
    )


def main(argv):
    stl_dir = Path(argv[1]) if len(argv) > 1 else Path(__file__).resolve().parents[1] / "stl"
    stls = sorted(stl_dir.glob("*.stl"))
    if not stls:
        print(f"NO STL FILES in {stl_dir}")
        return 1

    print(f"{'part':28} {'tris':>7}  {'size (X x Y x Z) mm':>26}  fit")
    print("-" * 72)
    ok_all = True
    for p in stls:
        tris = load_triangles(p)
        if not tris:
            print(f"{p.stem:28} {0:>7}  {'EMPTY':>26}  FAIL")
            ok_all = False
            continue
        lo, hi = bbox(tris)
        size = (hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2])
        fits = size[0] <= BED[0] and size[1] <= BED[1] and size[2] <= BED[2]
        ok_all = ok_all and fits
        sz = f"{size[0]:6.1f} x {size[1]:6.1f} x {size[2]:6.1f}"
        print(f"{p.stem:28} {len(tris):>7}  {sz:>26}  {'OK' if fits else 'TOO BIG'}")

    print("-" * 72)
    print("ALL OK" if ok_all else "PROBLEMS FOUND")
    return 0 if ok_all else 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
