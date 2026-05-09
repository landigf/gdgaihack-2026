"""
Generate 7 stylized low-poly Mars-base building GLB files.

Constraints (from hackathon spec):
  - Y-up, centered (X,Z=0, base at Y=0 for ground placement)
  - Forward face: -Z
  - Each fits inside its assigned bounding box
  - PBR materials with embedded data inside GLB (single file)
  - 500-2000 tris per building
  - <=500 KB per file
  - Empty node "ALERT_RING_ANCHOR" at top-center for runtime alert ring
  - CC0 license (own procedural work)

Run:
    python3 generate_buildings.py [output_dir]
"""

from __future__ import annotations
import os
import sys
import math
from typing import Optional, Sequence

import numpy as np
import trimesh
from pygltflib import GLTF2, Node


# ---------- color helpers --------------------------------------------------

def hex_to_rgba(hex_str: str, alpha: float = 1.0) -> list[float]:
    """'#e7e5e4' -> [0.906, 0.898, 0.882, 1.0]"""
    s = hex_str.lstrip("#")
    r = int(s[0:2], 16) / 255.0
    g = int(s[2:4], 16) / 255.0
    b = int(s[4:6], 16) / 255.0
    return [r, g, b, alpha]


def make_pbr(
    name: str,
    color_hex: str,
    *,
    alpha: float = 1.0,
    metallic: float = 0.1,
    roughness: float = 0.65,
    emissive_hex: Optional[str] = None,
    emissive_strength: float = 1.0,
    double_sided: bool = False,
) -> trimesh.visual.material.PBRMaterial:
    base = hex_to_rgba(color_hex, alpha)
    kwargs = dict(
        name=name,
        baseColorFactor=base,
        metallicFactor=metallic,
        roughnessFactor=roughness,
        doubleSided=double_sided,
    )
    if alpha < 1.0:
        kwargs["alphaMode"] = "BLEND"
    if emissive_hex is not None:
        em = hex_to_rgba(emissive_hex, 1.0)[:3]
        kwargs["emissiveFactor"] = [c * emissive_strength for c in em]
    return trimesh.visual.material.PBRMaterial(**kwargs)


def apply_material(mesh: trimesh.Trimesh, material) -> trimesh.Trimesh:
    mesh.visual = trimesh.visual.TextureVisuals(material=material)
    return mesh


# ---------- primitives (Y-up, base at origin or as needed) -----------------

def y_cylinder(radius: float, height: float, sections: int = 16) -> trimesh.Trimesh:
    """Vertical cylinder, axis = Y, centered at origin (base at -h/2, top at +h/2)."""
    c = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    R = trimesh.transformations.rotation_matrix(np.pi / 2.0, [1.0, 0.0, 0.0])
    c.apply_transform(R)
    return c


def x_cylinder(radius: float, length: float, sections: int = 16) -> trimesh.Trimesh:
    """Horizontal cylinder, axis = X, centered at origin."""
    c = trimesh.creation.cylinder(radius=radius, height=length, sections=sections)
    R = trimesh.transformations.rotation_matrix(np.pi / 2.0, [0.0, 1.0, 0.0])
    c.apply_transform(R)
    return c


def z_cylinder(radius: float, length: float, sections: int = 16) -> trimesh.Trimesh:
    """Cylinder along Z (default trimesh axis); centered at origin."""
    return trimesh.creation.cylinder(radius=radius, height=length, sections=sections)


def y_cone(radius: float, height: float, sections: int = 12) -> trimesh.Trimesh:
    """Cone pointing +Y, base at origin Y=0."""
    c = trimesh.creation.cone(radius=radius, height=height, sections=sections)
    # cone default: axis=Z, base at z=0, tip at z=h. rotate so tip points +Y.
    R = trimesh.transformations.rotation_matrix(-np.pi / 2.0, [1.0, 0.0, 0.0])
    c.apply_transform(R)
    return c


def hemisphere(radius: float, subdivisions: int = 3) -> trimesh.Trimesh:
    """Upper half of an icosphere (Y > 0). Useful for domes."""
    s = trimesh.creation.icosphere(subdivisions=subdivisions, radius=radius)
    # Trim faces whose centroid Y < 0
    centroids = s.triangles_center
    keep = centroids[:, 1] >= -1e-6
    faces = s.faces[keep]
    # Re-build with only kept faces; trimesh will keep all verts but mark unreferenced
    h = trimesh.Trimesh(vertices=s.vertices, faces=faces, process=True)
    return h


def box(extents_xyz: Sequence[float]) -> trimesh.Trimesh:
    return trimesh.creation.box(extents=list(extents_xyz))


# ---------- export with ALERT_RING_ANCHOR ----------------------------------

def export_with_anchor(
    scene: trimesh.Scene,
    anchor_y: float,
    output_path: str,
    asset_name: str,
) -> int:
    """Export a trimesh.Scene to GLB and append a named empty node at (0, anchor_y, 0).
    Returns the size in bytes."""
    scene.export(output_path)
    gltf = GLTF2().load(output_path)
    anchor = Node(name="ALERT_RING_ANCHOR", translation=[0.0, float(anchor_y), 0.0])
    gltf.nodes.append(anchor)
    new_idx = len(gltf.nodes) - 1
    scene_obj = gltf.scenes[gltf.scene if gltf.scene is not None else 0]
    scene_obj.nodes.append(new_idx)
    if gltf.asset is not None:
        gltf.asset.generator = f"polisa procedural ({asset_name}) - CC0"
    gltf.save(output_path)
    return os.path.getsize(output_path)


# ---------- BUILDING 1: habitat -------------------------------------------
# Bbox 2.5 W x 2.0 H x 1.6 D - white cylinder + caps + roof solar + antenna
# Body color #e7e5e4, accent #22d3ee, dark #1f2937

def build_habitat(out_path: str) -> int:
    body_mat = make_pbr("habitat_body", "#e7e5e4", metallic=0.05, roughness=0.55)
    accent_mat = make_pbr("habitat_solar", "#22d3ee", metallic=0.55, roughness=0.25)
    dark_mat = make_pbr("habitat_dark", "#1f2937", metallic=0.7, roughness=0.4)

    scene = trimesh.Scene()

    # Main horizontal cylinder body (axis=X). Length 2.0, radius 0.7.
    body_radius = 0.7
    body_length = 2.0
    body = x_cylinder(body_radius, body_length, sections=20)
    body.apply_translation([0.0, body_radius, 0.0])  # base sits on ground
    scene.add_geometry(apply_material(body, body_mat), node_name="body")

    # Two end caps (slightly larger, dark) - flattened cylinders at each end
    cap_r = 0.72
    cap_t = 0.08
    for sx in (-1.0, 1.0):
        cap = x_cylinder(cap_r, cap_t, sections=20)
        cap.apply_translation([sx * (body_length / 2.0 + cap_t / 2.0), body_radius, 0.0])
        scene.add_geometry(apply_material(cap, dark_mat), node_name=f"cap_{int(sx)}")

    # Roof solar panel - thin box on top center
    panel_w, panel_h, panel_d = 1.4, 0.04, 0.45
    panel = box([panel_w, panel_h, panel_d])
    panel.apply_translation([0.0, body_radius * 2 + panel_h / 2.0, 0.0])
    scene.add_geometry(apply_material(panel, accent_mat), node_name="solar_panel")

    # Tiny antenna on top - thin tall cylinder + sphere tip
    ant_h = 0.32
    antenna = y_cylinder(0.018, ant_h, sections=8)
    antenna.apply_translation([0.55, body_radius * 2 + panel_h + ant_h / 2.0, 0.0])
    scene.add_geometry(apply_material(antenna, dark_mat), node_name="antenna_pole")
    tip = trimesh.creation.icosphere(subdivisions=1, radius=0.05)
    tip.apply_translation([0.55, body_radius * 2 + panel_h + ant_h + 0.04, 0.0])
    scene.add_geometry(apply_material(tip, accent_mat), node_name="antenna_tip")

    # Tiny porthole on front face (-Z) for character
    porthole = z_cylinder(0.13, 0.03, sections=14)
    # z_cylinder axis=Z; we want it on -Z face, so position z = -body_radius - 0.01
    porthole.apply_translation([0.0, body_radius, -body_radius - 0.005])
    scene.add_geometry(apply_material(porthole, dark_mat), node_name="porthole")

    anchor_y = body_radius * 2 + panel_h + ant_h + 0.12
    return export_with_anchor(scene, anchor_y, out_path, "habitat")


# ---------- BUILDING 2: greenhouse -----------------------------------------
# Bbox 2.4 x 2.2 x 2.4 - translucent green dome + plant rack hint
# Dome #86efac alpha 0.85, interior #15803d

def build_greenhouse(out_path: str) -> int:
    dome_mat = make_pbr(
        "greenhouse_dome", "#86efac",
        alpha=0.55, metallic=0.0, roughness=0.25,
        double_sided=True,
    )
    rack_mat = make_pbr("greenhouse_rack_dark", "#15803d", metallic=0.1, roughness=0.6)
    leaves_mat = make_pbr("greenhouse_leaves", "#22c55e", metallic=0.0, roughness=0.85)
    base_mat = make_pbr("greenhouse_base", "#475569", metallic=0.4, roughness=0.5)

    scene = trimesh.Scene()

    # Low cylindrical base ring (foundation)
    base_h = 0.12
    base = y_cylinder(1.18, base_h, sections=24)
    base.apply_translation([0.0, base_h / 2.0, 0.0])
    scene.add_geometry(apply_material(base, base_mat), node_name="base_ring")

    # Plant racks INSIDE (visible through translucent dome)
    rack_y = base_h + 0.05
    for x_offset, z_offset in [(-0.55, 0.0), (0.55, 0.0), (0.0, -0.55), (0.0, 0.55)]:
        rack = box([0.35, 0.35, 0.18])
        rack.apply_translation([x_offset, rack_y + 0.175, z_offset])
        scene.add_geometry(apply_material(rack, rack_mat), node_name=f"rack_{x_offset}_{z_offset}")
        # Tiny leaf cluster on top (icosphere lo-poly)
        leaves = trimesh.creation.icosphere(subdivisions=1, radius=0.13)
        leaves.apply_translation([x_offset, rack_y + 0.35 + 0.1, z_offset])
        scene.add_geometry(apply_material(leaves, leaves_mat), node_name=f"leaves_{x_offset}_{z_offset}")

    # Central tall planter
    central_planter = y_cylinder(0.18, 0.4, sections=10)
    central_planter.apply_translation([0.0, base_h + 0.2, 0.0])
    scene.add_geometry(apply_material(central_planter, rack_mat), node_name="central_planter")
    central_leaves = trimesh.creation.icosphere(subdivisions=2, radius=0.25)
    central_leaves.apply_translation([0.0, base_h + 0.4 + 0.18, 0.0])
    scene.add_geometry(apply_material(central_leaves, leaves_mat), node_name="central_leaves")

    # Translucent dome - hemisphere radius 1.18, sitting on top of base
    dome_radius = 1.18
    dome = hemisphere(dome_radius, subdivisions=3)
    dome.apply_translation([0.0, base_h, 0.0])
    scene.add_geometry(apply_material(dome, dome_mat), node_name="dome")

    anchor_y = base_h + dome_radius + 0.08
    return export_with_anchor(scene, anchor_y, out_path, "greenhouse")


# ---------- BUILDING 3: eclss ----------------------------------------------
# Bbox 2.4 W x 1.2 H x 1.6 D - 3 grey racks side-by-side with pipes/grilles
# Rack #94a3b8, pipe #475569, accent #38bdf8

def build_eclss(out_path: str) -> int:
    rack_mat = make_pbr("eclss_rack", "#94a3b8", metallic=0.55, roughness=0.45)
    pipe_mat = make_pbr("eclss_pipe", "#475569", metallic=0.7, roughness=0.35)
    accent_mat = make_pbr("eclss_accent", "#38bdf8", metallic=0.4, roughness=0.3,
                          emissive_hex="#38bdf8", emissive_strength=0.4)
    grille_mat = make_pbr("eclss_grille", "#1f2937", metallic=0.6, roughness=0.5)

    scene = trimesh.Scene()

    # 3 racks side-by-side. Total W ~2.4 -> each 0.75, gap 0.075
    rack_w = 0.75
    rack_h = 1.0
    rack_d = 1.4
    gap = 0.075
    total_w = 3 * rack_w + 2 * gap
    start_x = -total_w / 2.0 + rack_w / 2.0

    for i in range(3):
        cx = start_x + i * (rack_w + gap)
        rack = box([rack_w, rack_h, rack_d])
        rack.apply_translation([cx, rack_h / 2.0, 0.0])
        scene.add_geometry(apply_material(rack, rack_mat), node_name=f"rack_{i}")

        # Grille on front face
        grille = box([rack_w * 0.7, rack_h * 0.6, 0.025])
        grille.apply_translation([cx, rack_h / 2.0, -rack_d / 2.0 - 0.012])
        scene.add_geometry(apply_material(grille, grille_mat), node_name=f"grille_{i}")

        # Tiny accent LED stripe
        led = box([rack_w * 0.5, 0.02, 0.012])
        led.apply_translation([cx, rack_h * 0.85, -rack_d / 2.0 - 0.018])
        scene.add_geometry(apply_material(led, accent_mat), node_name=f"led_{i}")

    # Top pipes connecting the 3 racks (horizontal cylinder along X)
    top_y = rack_h + 0.05
    pipe1 = x_cylinder(0.06, total_w * 0.95, sections=10)
    pipe1.apply_translation([0.0, top_y, -0.35])
    scene.add_geometry(apply_material(pipe1, pipe_mat), node_name="pipe_top_a")
    pipe2 = x_cylinder(0.06, total_w * 0.95, sections=10)
    pipe2.apply_translation([0.0, top_y, 0.35])
    scene.add_geometry(apply_material(pipe2, pipe_mat), node_name="pipe_top_b")
    # Vertical risers on each end
    for sx in (-1, 1):
        for sz in (-0.35, 0.35):
            riser = y_cylinder(0.06, 0.18, sections=8)
            riser.apply_translation([sx * (total_w / 2.0 - 0.05), rack_h + 0.05 - 0.09, sz])
            scene.add_geometry(apply_material(riser, pipe_mat))

    anchor_y = top_y + 0.12
    return export_with_anchor(scene, anchor_y, out_path, "eclss")


# ---------- BUILDING 4: isru -----------------------------------------------
# Bbox 3.0 W x 2.4 H x 2.0 D - tall reactor cylinder + storage tank dome
# Metal #cbd5e1, hot core #dc2626, tank #94a3b8

def build_isru(out_path: str) -> int:
    metal_mat = make_pbr("isru_metal", "#cbd5e1", metallic=0.7, roughness=0.4)
    core_mat = make_pbr(
        "isru_core", "#dc2626",
        metallic=0.0, roughness=0.6,
        emissive_hex="#dc2626", emissive_strength=2.5,
    )
    tank_mat = make_pbr("isru_tank", "#94a3b8", metallic=0.65, roughness=0.4)
    pipe_mat = make_pbr("isru_pipe", "#475569", metallic=0.7, roughness=0.35)
    band_mat = make_pbr("isru_band", "#1f2937", metallic=0.65, roughness=0.45)

    scene = trimesh.Scene()

    # Tall reactor on the LEFT (-X side). radius 0.55, height 1.78 so
    # height + dome cap (radius 0.55) <= bbox H 2.4.
    reactor_r = 0.55
    reactor_h = 1.78
    reactor_x = -0.7
    reactor = y_cylinder(reactor_r, reactor_h, sections=18)
    reactor.apply_translation([reactor_x, reactor_h / 2.0, 0.0])
    scene.add_geometry(apply_material(reactor, metal_mat), node_name="reactor_shell")

    # Reactor cap (dome on top)
    rcap = hemisphere(reactor_r, subdivisions=2)
    rcap.apply_translation([reactor_x, reactor_h, 0.0])
    scene.add_geometry(apply_material(rcap, metal_mat), node_name="reactor_cap")

    # Glowing core hint - small inner cylinder visible via 2 vent slots (boxes)
    # We approximate "glow hint" with two thin emissive bands on the reactor
    for slot_y in (0.45, 1.05, 1.55):
        band = box([0.04, 0.18, reactor_r * 1.6])
        band.apply_translation([reactor_x - reactor_r - 0.001, slot_y, 0.0])
        scene.add_geometry(apply_material(band, core_mat), node_name=f"glow_slot_{slot_y}")
    # Dark band rings (decorative metal ribs)
    for ring_y in (0.3, 0.9, 1.5):
        ring = y_cylinder(reactor_r + 0.015, 0.05, sections=18)
        ring.apply_translation([reactor_x, ring_y, 0.0])
        scene.add_geometry(apply_material(ring, band_mat), node_name=f"ring_{ring_y}")

    # Storage tank on the RIGHT (+X side) - lower wide cylinder + dome
    tank_r = 0.65
    tank_h = 0.85
    tank_x = 0.85
    tank = y_cylinder(tank_r, tank_h, sections=18)
    tank.apply_translation([tank_x, tank_h / 2.0, 0.0])
    scene.add_geometry(apply_material(tank, tank_mat), node_name="tank_body")
    # Dome on top of tank
    tdome = hemisphere(tank_r, subdivisions=2)
    tdome.apply_translation([tank_x, tank_h, 0.0])
    scene.add_geometry(apply_material(tdome, tank_mat), node_name="tank_dome")
    # Bottom dark base ring
    tbase = y_cylinder(tank_r + 0.04, 0.06, sections=18)
    tbase.apply_translation([tank_x, 0.03, 0.0])
    scene.add_geometry(apply_material(tbase, band_mat), node_name="tank_base")

    # Pipe connecting reactor and tank (horizontal cylinder at mid-height)
    pipe_y = 0.65
    pipe_len = (tank_x - tank_r) - (reactor_x + reactor_r)
    pipe_cx = (reactor_x + reactor_r + tank_x - tank_r) / 2.0
    pipe = x_cylinder(0.07, pipe_len, sections=10)
    pipe.apply_translation([pipe_cx, pipe_y, 0.0])
    scene.add_geometry(apply_material(pipe, pipe_mat), node_name="pipe_connector")
    # Pipe joints (small dark spheres)
    for jx in (reactor_x + reactor_r, tank_x - tank_r):
        joint = trimesh.creation.icosphere(subdivisions=1, radius=0.08)
        joint.apply_translation([jx, pipe_y, 0.0])
        scene.add_geometry(apply_material(joint, band_mat))

    anchor_y = max(reactor_h + reactor_r * 0.3, tank_h + tank_r) + 0.12
    return export_with_anchor(scene, anchor_y, out_path, "isru")


# ---------- BUILDING 5: power ----------------------------------------------
# Bbox 4.0 W x 1.5 H x 3.0 D - 3 tilted solar panels + 5 small reactors
# panel #1e3a8a, support #475569, reactor #cbd5e1, glow #a78bfa

def build_power(out_path: str) -> int:
    panel_mat = make_pbr("power_panel", "#1e3a8a", metallic=0.55, roughness=0.25,
                         emissive_hex="#1e3a8a", emissive_strength=0.15)
    support_mat = make_pbr("power_support", "#475569", metallic=0.7, roughness=0.45)
    reactor_mat = make_pbr("power_reactor", "#cbd5e1", metallic=0.7, roughness=0.4)
    glow_mat = make_pbr("power_glow", "#a78bfa",
                        metallic=0.0, roughness=0.5,
                        emissive_hex="#a78bfa", emissive_strength=2.5)
    cap_mat = make_pbr("power_cap", "#1f2937", metallic=0.65, roughness=0.4)

    scene = trimesh.Scene()

    # 3 tilted solar panels in a row along the BACK (+Z half).
    # Each panel: width 1.1 (along X), depth 0.85 (along sloped face), thickness 0.04
    panel_w = 1.1
    panel_d = 0.85
    panel_t = 0.04
    panel_tilt = math.radians(28)
    spacing = 1.25
    panel_z = 0.6

    for i, dx in enumerate([-spacing, 0.0, spacing]):
        # Build panel as box, then rotate around X (tilt back)
        p = box([panel_w, panel_t, panel_d])
        # Tilt around X-axis so the +Z edge goes up
        Rt = trimesh.transformations.rotation_matrix(panel_tilt, [1, 0, 0])
        p.apply_transform(Rt)
        # After tilt, place center at (dx, panel_h_center, panel_z)
        # The panel's lowest point sits at ~ panel_d/2 * sin(tilt) below center, want base at ~0.45
        center_y = 0.65
        p.apply_translation([dx, center_y, panel_z])
        scene.add_geometry(apply_material(p, panel_mat), node_name=f"panel_{i}")

        # Support pole under each panel
        pole = y_cylinder(0.05, center_y, sections=8)
        pole.apply_translation([dx, center_y / 2.0, panel_z])
        scene.add_geometry(apply_material(pole, support_mat), node_name=f"pole_{i}")

    # 5 Kilopower reactors in a row along the FRONT (-Z half).
    # Each: small cylinder + cone tip + tiny purple glow ring
    n_reactors = 5
    r_radius = 0.18
    r_height = 0.45
    cone_h = 0.18
    r_z = -1.0
    r_spacing = 0.7
    r_start_x = -((n_reactors - 1) / 2.0) * r_spacing

    for i in range(n_reactors):
        rx = r_start_x + i * r_spacing
        body = y_cylinder(r_radius, r_height, sections=12)
        body.apply_translation([rx, r_height / 2.0, r_z])
        scene.add_geometry(apply_material(body, reactor_mat), node_name=f"react_body_{i}")

        # Cap base (dark)
        rcap = y_cylinder(r_radius + 0.02, 0.04, sections=12)
        rcap.apply_translation([rx, 0.02, r_z])
        scene.add_geometry(apply_material(rcap, cap_mat))

        # Cone tip
        tip = y_cone(r_radius * 0.85, cone_h, sections=10)
        tip.apply_translation([rx, r_height, r_z])
        scene.add_geometry(apply_material(tip, reactor_mat), node_name=f"react_cone_{i}")

        # Tiny glow ring near top (purple)
        glow = y_cylinder(r_radius + 0.005, 0.04, sections=12)
        glow.apply_translation([rx, r_height - 0.06, r_z])
        scene.add_geometry(apply_material(glow, glow_mat), node_name=f"react_glow_{i}")

    anchor_y = 0.65 + (panel_d / 2.0) * math.sin(panel_tilt) + 0.15
    return export_with_anchor(scene, anchor_y, out_path, "power")


# ---------- BUILDING 6: airlock --------------------------------------------
# Bbox 1.4 W x 1.2 H x 1.0 D - small horizontal yellow chamber + hatch + lamp
# body #fbbf24, hatch #1f2937, lamp #facc15

def build_airlock(out_path: str) -> int:
    body_mat = make_pbr("airlock_body", "#fbbf24", metallic=0.4, roughness=0.4)
    hatch_mat = make_pbr("airlock_hatch", "#1f2937", metallic=0.7, roughness=0.4)
    lamp_mat = make_pbr(
        "airlock_lamp", "#facc15",
        metallic=0.0, roughness=0.4,
        emissive_hex="#facc15", emissive_strength=3.0,
    )
    rim_mat = make_pbr("airlock_rim", "#a16207", metallic=0.6, roughness=0.45)

    scene = trimesh.Scene()

    # Horizontal cylinder body (axis = X). Length 1.0, radius 0.45
    body_r = 0.45
    body_len = 1.0
    body = x_cylinder(body_r, body_len, sections=18)
    body.apply_translation([0.0, body_r, 0.0])
    scene.add_geometry(apply_material(body, body_mat), node_name="body")

    # Hatch ring on -X end (front face)
    ring = x_cylinder(body_r + 0.04, 0.06, sections=18)
    ring.apply_translation([-body_len / 2.0 - 0.03, body_r, 0.0])
    scene.add_geometry(apply_material(ring, rim_mat), node_name="hatch_ring")
    # Hatch disc (dark, slightly inset)
    hatch = x_cylinder(body_r * 0.85, 0.04, sections=18)
    hatch.apply_translation([-body_len / 2.0 + 0.01, body_r, 0.0])
    scene.add_geometry(apply_material(hatch, hatch_mat), node_name="hatch_disc")
    # Hatch handle (small box)
    handle = box([0.04, 0.18, 0.04])
    handle.apply_translation([-body_len / 2.0 - 0.02, body_r, 0.0])
    scene.add_geometry(apply_material(handle, rim_mat), node_name="hatch_handle")

    # Caution lamp on top
    lamp_base = y_cylinder(0.06, 0.05, sections=10)
    lamp_base.apply_translation([0.0, body_r * 2 + 0.025, 0.0])
    scene.add_geometry(apply_material(lamp_base, hatch_mat))
    lamp = trimesh.creation.icosphere(subdivisions=2, radius=0.085)
    lamp.apply_translation([0.0, body_r * 2 + 0.05 + 0.085, 0.0])
    scene.add_geometry(apply_material(lamp, lamp_mat), node_name="lamp")

    # Rear cap on +X
    rear_cap = x_cylinder(body_r + 0.02, 0.05, sections=18)
    rear_cap.apply_translation([body_len / 2.0 + 0.025, body_r, 0.0])
    scene.add_geometry(apply_material(rear_cap, rim_mat), node_name="rear_cap")

    anchor_y = body_r * 2 + 0.05 + 0.085 * 2 + 0.08
    return export_with_anchor(scene, anchor_y, out_path, "airlock")


# ---------- BUILDING 7: rover_garage ---------------------------------------
# Bbox 2.6 W x 1.5 H x 1.6 D - half-cylinder shell open at front + rover sticking out
# shell #475569, rover body #e2e8f0, wheels #1f2937, solar lid #1e3a8a

def build_rover_garage(out_path: str) -> int:
    shell_mat = make_pbr("garage_shell", "#475569", metallic=0.65, roughness=0.45)
    floor_mat = make_pbr("garage_floor", "#334155", metallic=0.4, roughness=0.6)
    rover_body_mat = make_pbr("rover_body", "#e2e8f0", metallic=0.45, roughness=0.4)
    wheel_mat = make_pbr("rover_wheel", "#1f2937", metallic=0.5, roughness=0.7)
    solar_mat = make_pbr("rover_solar", "#1e3a8a", metallic=0.55, roughness=0.25)
    accent_mat = make_pbr("rover_accent", "#22d3ee", metallic=0.4, roughness=0.3,
                          emissive_hex="#22d3ee", emissive_strength=0.4)

    scene = trimesh.Scene()

    # Shell: half-cylinder along X, open at -Z (front).
    # Use a y_cylinder oriented with axis along X (so x_cylinder), then trim faces with z < 0.
    shell_r = 0.7
    shell_len = 1.5
    shell_full = x_cylinder(shell_r, shell_len, sections=20)
    # Trim the half facing -Z (front opening): keep faces whose centroid Z >= 0
    centroids = shell_full.triangles_center
    keep = centroids[:, 2] >= -0.02
    shell = trimesh.Trimesh(vertices=shell_full.vertices, faces=shell_full.faces[keep], process=True)
    # Lift base to ground
    shell.apply_translation([0.0, shell_r, 0.0])
    apply_material(shell, shell_mat)
    shell.visual.material.doubleSided = True
    scene.add_geometry(shell, node_name="garage_shell")

    # Floor inside the garage (thin box)
    floor = box([shell_len, 0.04, shell_r * 1.8])
    floor.apply_translation([0.0, 0.02, 0.0])
    scene.add_geometry(apply_material(floor, floor_mat), node_name="garage_floor")

    # Rover sticking out the front (-Z). Body offset toward -Z so half is outside.
    rb_w = 0.55  # along X
    rb_h = 0.22  # along Y
    rb_d = 0.85  # along Z
    rover_z = -0.45  # body center pushed forward
    rover_y = 0.16  # body center above wheels
    body = box([rb_w, rb_h, rb_d])
    body.apply_translation([0.0, rover_y, rover_z])
    scene.add_geometry(apply_material(body, rover_body_mat), node_name="rover_body")

    # Solar lid on top of rover body
    lid = box([rb_w * 0.9, 0.025, rb_d * 0.85])
    lid.apply_translation([0.0, rover_y + rb_h / 2.0 + 0.013, rover_z])
    scene.add_geometry(apply_material(lid, solar_mat), node_name="rover_solar_lid")

    # 4 wheels - cylinders with axis along X
    wheel_r = 0.12
    wheel_w = 0.07
    wheel_y = wheel_r
    for sx in (-1, 1):
        for sz in (-0.6, 0.7):  # back wheel inside garage, front wheel outside
            wz = rover_z + sz * (rb_d / 2.0 - 0.05)
            w = x_cylinder(wheel_r, wheel_w, sections=12)
            w.apply_translation([sx * (rb_w / 2.0 + wheel_w / 2.0 - 0.01), wheel_y, wz])
            scene.add_geometry(apply_material(w, wheel_mat), node_name=f"wheel_{sx}_{sz}")

    # Front-facing accent strip (cyan) on rover nose
    accent = box([rb_w * 0.6, 0.04, 0.025])
    accent.apply_translation([0.0, rover_y + 0.02, rover_z - rb_d / 2.0 - 0.012])
    scene.add_geometry(apply_material(accent, accent_mat), node_name="rover_accent")

    # Garage entrance frame (ring on -Z opening edge)
    # Build a thin torus-like ring using trimesh annulus path - simpler: 2 boxes top + sides
    # Top lip
    lip_top = box([shell_len + 0.04, 0.06, 0.06])
    lip_top.apply_translation([0.0, shell_r * 2 - 0.03, 0.0])
    scene.add_geometry(apply_material(lip_top, accent_mat), node_name="entrance_lip")

    anchor_y = shell_r * 2 + 0.1
    return export_with_anchor(scene, anchor_y, out_path, "rover_garage")


# ---------- driver ---------------------------------------------------------

BUILDINGS = [
    ("habitat.glb", build_habitat, (2.5, 2.0, 1.6)),
    ("greenhouse.glb", build_greenhouse, (2.4, 2.2, 2.4)),
    ("eclss.glb", build_eclss, (2.4, 1.2, 1.6)),
    ("isru.glb", build_isru, (3.0, 2.4, 2.0)),
    ("power.glb", build_power, (4.0, 1.5, 3.0)),
    ("airlock.glb", build_airlock, (1.4, 1.2, 1.0)),
    ("rover_garage.glb", build_rover_garage, (2.6, 1.5, 1.6)),
]

MAX_BYTES = 500 * 1024


def verify(path: str, target_bbox: tuple[float, float, float]) -> dict:
    """Re-load the produced GLB and verify constraints."""
    gltf = GLTF2().load(path)
    sz = os.path.getsize(path)
    named_nodes = [n.name for n in gltf.nodes if n.name]
    has_anchor = "ALERT_RING_ANCHOR" in named_nodes
    n_meshes = len(gltf.meshes)
    n_mats = len(gltf.materials)
    # Estimate triangle count by summing primitive indices/3 if we can
    tri_count = 0
    for m in gltf.meshes:
        for prim in m.primitives:
            if prim.indices is not None:
                acc = gltf.accessors[prim.indices]
                tri_count += acc.count // 3
    # bbox via trimesh
    tm = trimesh.load(path, force="scene")
    bbox = tm.bounds  # 2x3
    extents = bbox[1] - bbox[0]
    fits = all(extents[i] <= target_bbox[i] + 0.05 for i in range(3))
    return dict(
        size=sz,
        size_kb=sz / 1024,
        size_ok=sz <= MAX_BYTES,
        has_anchor=has_anchor,
        n_meshes=n_meshes,
        n_materials=n_mats,
        tri_count=tri_count,
        tri_ok=tri_count <= 2200,
        extents=extents.tolist(),
        target=list(target_bbox),
        bbox_fits=fits,
    )


def main():
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "/tmp/glb_test/buildings"
    os.makedirs(out_dir, exist_ok=True)

    print(f"\nGenerating 7 Mars-base GLB files into {out_dir}\n")
    print(f"  {'name':<20} {'size':>8}  {'tris':>5}  {'anchor':>7}  {'fits_bbox':>10}  extents")
    print("  " + "-" * 95)
    overall_ok = True
    for name, builder, bbox in BUILDINGS:
        path = os.path.join(out_dir, name)
        builder(path)
        r = verify(path, bbox)
        status = "OK" if (r["size_ok"] and r["has_anchor"] and r["bbox_fits"] and r["tri_ok"]) else "FAIL"
        if status == "FAIL":
            overall_ok = False
        ext_s = f"[{r['extents'][0]:.2f}, {r['extents'][1]:.2f}, {r['extents'][2]:.2f}]"
        tgt_s = f"[{r['target'][0]:.1f}, {r['target'][1]:.1f}, {r['target'][2]:.1f}]"
        print(f"  {name:<20} {r['size_kb']:>6.1f}KB  {r['tri_count']:>5}  "
              f"{'YES' if r['has_anchor'] else 'NO':>7}  {'YES' if r['bbox_fits'] else 'NO':>10}  "
              f"{ext_s} (target {tgt_s}) [{status}]")

    print()
    if overall_ok:
        print("ALL 7 BUILDINGS OK")
    else:
        print("SOME BUILDINGS FAILED VERIFICATION - see above")
    return 0 if overall_ok else 1


if __name__ == "__main__":
    sys.exit(main())
