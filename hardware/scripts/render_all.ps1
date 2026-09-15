# SPDX-License-Identifier: CERN-OHL-P-2.0
# SPDX-FileCopyrightText: 2026 CLSOFTLAB / Dr. Lee Il-guk (이일국) and Fireflies contributors
#
# render_all.ps1 — export every dispenser/jellyfish part to STL + a preview PNG.
# STLs -> hardware\stl\ , PNGs -> hardware\renders\
$ErrorActionPreference = "Stop"

# OpenSCAD location (override by setting $env:OPENSCAD before running).
if (-not $env:OPENSCAD) { $env:OPENSCAD = "C:\Program Files\OpenSCAD\openscad.com" }

$here   = Split-Path -Parent $MyInvocation.MyCommand.Path
$hw     = Split-Path -Parent $here
$scad   = Join-Path $hw "openscad"
$stlDir = Join-Path $hw "stl"
$pngDir = Join-Path $hw "renders"
New-Item -ItemType Directory -Force -Path $stlDir, $pngDir | Out-Null

Write-Host "OpenSCAD: $env:OPENSCAD"
& $env:OPENSCAD --version
if ($LASTEXITCODE -ne 0) { throw "OpenSCAD not found at $($env:OPENSCAD)" }

Get-ChildItem -Path $scad -Filter *.scad | ForEach-Object {
    $name = $_.BaseName
    Write-Host "=== $name ==="
    & $env:OPENSCAD -o (Join-Path $stlDir "$name.stl") $_.FullName
    & $env:OPENSCAD -o (Join-Path $pngDir "$name.png") `
        --imgsize=900,700 --autocenter --viewall --render `
        --colorscheme=Tomorrow $_.FullName
}
Write-Host "Done. STLs in $stlDir , PNGs in $pngDir"
