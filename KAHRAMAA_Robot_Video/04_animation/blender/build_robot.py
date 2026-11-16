"""
KAHRAMAA reservoir-cleaning robot · Concept C1 (battery-powered tracked brush–hydrocyclone crawler)
Procedural Blender model + review renders.

Run:  Blender -b -P build_robot.py -- [--views hero,side,...] [--samples 128] [--res 1920x1080]
Axes: +X = front (suction hood), +Y = left, +Z = up. Units = metres. Ground at z = 0.
Sized to the preliminary envelope (~0.9 × 0.65 × 0.45 m body) so it passes a 1 m × 1 m hatch.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'renders', 'model_v1')
os.makedirs(OUT, exist_ok=True)

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default):
    return argv[argv.index(name) + 1] if name in argv else default
VIEWS = arg('--views', 'hero,side,rear,top,hook,hatch,parts,brush,context').split(',')
SAMPLES = int(arg('--samples', '128'))
RES = [int(v) for v in arg('--res', '1920x1080').split('x')]

# ---------------------------------------------------------------- scene reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
ROBOT = bpy.data.collections.new('Robot'); scene.collection.children.link(ROBOT)
HOOKC = bpy.data.collections.new('Hook'); scene.collection.children.link(HOOKC)
STAGE = bpy.data.collections.new('Stage'); scene.collection.children.link(STAGE)
HATCH = bpy.data.collections.new('HatchSet'); scene.collection.children.link(HATCH)

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)

def mat(name, hexcol, metal=0.0, rough=0.5, transm=0.0, ior=1.45, coat=0.0, emit=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(hexcol), 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    b.inputs['IOR'].default_value = ior
    if transm: b.inputs['Transmission Weight'].default_value = transm
    if coat: b.inputs['Coat Weight'].default_value = coat
    if emit:
        b.inputs['Emission Color'].default_value = (*lin(hexcol), 1)
        b.inputs['Emission Strength'].default_value = emit
    if alpha < 1: b.inputs['Alpha'].default_value = alpha
    return m

M = {
    'body': mat('Body grey', '#C4CACF', rough=0.38, coat=0.15),
    'body2': mat('Body dark', '#4A5056', rough=0.4),
    'rubber': mat('Track rubber', '#1B1C1E', rough=0.85),
    'steel': mat('Steel', '#C2C8CE', metal=1, rough=0.22),
    'steel_d': mat('Steel dark', '#6E757B', metal=1, rough=0.35),
    'brush': mat('Brush blue', '#1F6FD1', rough=0.6),
    'brush_core': mat('Brush core', '#174F94', rough=0.4),
    'pump': mat('Pump blue', '#2D5BA8', metal=0.3, rough=0.35, coat=0.4),
    'clear': mat('Clear acrylic', '#EAF4FA', rough=0.04, transm=1.0, ior=1.49),
    'hood': mat('Hood polycarbonate', '#8FA3B1', rough=0.12, alpha=0.2),
    'filter': mat('Filter canister', '#2F86CF', rough=0.18, transm=0.45, ior=1.49, coat=0.3),
    'filter_core': mat('Filter pleats', '#F1F4F6', rough=0.7),
    'battery': mat('Battery yellow', '#E5A400', rough=0.4, coat=0.2),
    'cart': mat('Cartridge maroon', '#5E0A1E', rough=0.4, coat=0.25),
    'hook': mat('Hook red', '#8E1610', rough=0.4, coat=0.2),
    'black': mat('Black plastic', '#121314', rough=0.45),
    'hose': mat('Hose', '#2A2E33', rough=0.6),
    'lamp': mat('Lamp', '#FFFFFF', emit=12),
    'sed': mat('Sediment', '#8A5A2B', rough=0.9),
    'ground': mat('Studio floor', '#D6D9DC', rough=0.75),
    'reservoir_floor': mat('Reservoir floor', '#8E8C86', rough=0.95),
    'pillar': mat('Reservoir pillar', '#A29E95', rough=0.95),
    'concrete': mat('Concrete', '#B9B6AF', rough=0.95),
}

ROOT = bpy.data.objects.new('ROBOT_ROOT', None); ROBOT.objects.link(ROOT)
HOOK_ROOT = bpy.data.objects.new('HOOK_ROOT', None); HOOKC.objects.link(HOOK_ROOT)

def smooth(me):
    for p in me.polygons: p.use_smooth = True

def finish(name, bm, material, coll=ROBOT, parent=ROOT, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, solid=0.0, smooth_it=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth_it: smooth(me)
    ob = bpy.data.objects.new(name, me); coll.objects.link(ob)
    ob.data.materials.append(material)
    ob.location = loc; ob.rotation_euler = rot
    if parent: ob.parent = parent
    if solid:
        s = ob.modifiers.new('solid', 'SOLIDIFY'); s.thickness = solid; s.offset = 0
    if bevel:
        b = ob.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = 3; b.limit_method = 'ANGLE'; b.harden_normals = True
    return ob

def box(name, size, loc, material, bevel=0.006, rot=(0, 0, 0), coll=ROBOT, parent=ROOT):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((*size, 1)))
    return finish(name, bm, material, coll, parent, loc, rot, bevel=bevel, smooth_it=False)

AX = {'Z': Matrix.Identity(4), 'X': Matrix.Rotation(math.pi / 2, 4, 'Y'), 'Y': Matrix.Rotation(math.pi / 2, 4, 'X')}

def cyl(name, r, depth, loc, material, axis='Z', r2=None, seg=48, bevel=0.0, caps=True, coll=ROBOT, parent=ROOT, solid=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=depth, matrix=AX[axis])
    return finish(name, bm, material, coll, parent, loc, bevel=bevel, solid=solid)

def torus(name, R, r, loc, material, rot=(0, 0, 0), coll=ROBOT, parent=ROOT):
    bm = bmesh.new(); n1, n2 = 48, 16
    for i in range(n1):
        a = 2 * math.pi * i / n1
        for j in range(n2):
            b = 2 * math.pi * j / n2
            bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))
    bm.verts.ensure_lookup_table(); V = bm.verts
    for i in range(n1):
        for j in range(n2):
            a, b, c, d = i * n2 + j, ((i + 1) % n1) * n2 + j, ((i + 1) % n1) * n2 + (j + 1) % n2, i * n2 + (j + 1) % n2
            bm.faces.new((V[a], V[b], V[c], V[d]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return finish(name, bm, material, coll, parent, loc, rot)

def pipe(name, pts, r, material, coll=ROBOT, parent=ROOT, poly=False):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = r; cu.bevel_resolution = 6; cu.use_fill_caps = True
    if poly:
        sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
        for p, co in zip(sp.points, pts): p.co = (*co, 1)
    else:
        sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
        for bp, co in zip(sp.bezier_points, pts):
            bp.co = co; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    ob = bpy.data.objects.new(name, cu); coll.objects.link(ob); cu.materials.append(material)
    if parent: ob.parent = parent
    return ob

# ---------------------------------------------------------------- tracks
TR_L, TR_R, TR_W, TR_T = 0.74, 0.10, 0.12, 0.022   # length, end radius, width, belt thickness
TR_X, TR_Y = -0.07, 0.265

def stadium(L, r, n_arc=28, n_str=26):
    a = L / 2 - r; P = []
    for i in range(n_str): P.append((-a + 2 * a * i / n_str, -r, 0, -1))
    for i in range(n_arc):
        t = -math.pi / 2 + math.pi * i / n_arc; P.append((a + r * math.cos(t), r * math.sin(t), math.cos(t), math.sin(t)))
    for i in range(n_str): P.append((a - 2 * a * i / n_str, r, 0, 1))
    for i in range(n_arc):
        t = math.pi / 2 + math.pi * i / n_arc; P.append((-a + r * math.cos(t), r * math.sin(t), math.cos(t), math.sin(t)))
    return P

def track(side):
    y0 = side * TR_Y
    P = stadium(TR_L, TR_R)
    bm = bmesh.new(); ring = []
    for x, z, nx, nz in P:
        o0 = bm.verts.new((x, -TR_W / 2, z)); o1 = bm.verts.new((x, TR_W / 2, z))
        i0 = bm.verts.new((x - nx * TR_T, -TR_W / 2, z - nz * TR_T)); i1 = bm.verts.new((x - nx * TR_T, TR_W / 2, z - nz * TR_T))
        ring.append((o0, o1, i0, i1))
    n = len(ring)
    for k in range(n):
        a, b = ring[k], ring[(k + 1) % n]
        bm.faces.new((a[0], b[0], b[1], a[1])); bm.faces.new((a[2], a[3], b[3], b[2]))
        bm.faces.new((a[0], a[2], b[2], b[0])); bm.faces.new((a[1], b[1], b[3], a[3]))
    # grousers (track shoes)
    for k in range(0, n, 2):
        x, z, nx, nz = P[k]
        th = math.atan2(nx, nz)
        Mx = Matrix.Translation((x + nx * 0.007, 0, z + nz * 0.007)) @ Matrix.Rotation(th, 4, 'Y') @ Matrix.Diagonal((0.016, TR_W * 1.02, 0.014, 1))
        bmesh.ops.create_cube(bm, size=1.0, matrix=Mx)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    finish(f'Track belt {"L" if side > 0 else "R"}', bm, M['rubber'], loc=(TR_X, y0, TR_R), smooth_it=False)
    a = TR_L / 2 - TR_R
    for i, xx in enumerate((TR_X - a, TR_X + a)):   # sprocket + idler
        cyl(f'Sprocket {side}{i}', TR_R - TR_T - 0.004, TR_W * 0.86, (xx, y0, TR_R), M['body2'], axis='Y', bevel=0.004)
        cyl(f'Hub {side}{i}', 0.03, TR_W * 0.94, (xx, y0, TR_R), M['steel'], axis='Y')
    for j in range(3):                               # road wheels
        xx = TR_X - a + (j + 1) * (2 * a) / 4
        cyl(f'Road wheel {side}{j}', 0.042, TR_W * 0.8, (xx, y0, TR_T + 0.044), M['body2'], axis='Y', bevel=0.003)
        cyl(f'Road hub {side}{j}', 0.016, TR_W * 0.86, (xx, y0, TR_T + 0.044), M['steel'], axis='Y')
    box(f'Track frame {side}', (2 * a, 0.03, 0.05), (TR_X, y0, TR_R), M['body2'], bevel=0.008)

track(1); track(-1)

# ---------------------------------------------------------------- hull + deck
box('Hull', (0.66, 0.40, 0.17), (-0.07, 0, 0.14), M['body'], bevel=0.02)
box('Deck', (0.74, 0.66, 0.03), (-0.07, 0, 0.235), M['body'], bevel=0.012)
box('Deck trim', (0.745, 0.665, 0.008), (-0.07, 0, 0.217), M['body2'], bevel=0.003)
bm = bmesh.new()
for i in range(18):
    for s in (1, -1):
        x = -0.42 + i * 0.041
        bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.006, radius2=0.006, depth=0.006, matrix=Matrix.Translation((x, s * 0.315, 0.252)))
for j in range(14):
    for s in (1, -1):
        y = -0.29 + j * 0.0446
        bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.006, radius2=0.006, depth=0.006, matrix=Matrix.Translation((-0.08 + s * 0.355, y, 0.252)))
finish('Deck bolts', bm, M['steel'])
for s in (1, -1):   # side fenders lip over the tracks
    box(f'Fender {s}', (0.70, 0.13, 0.012), (-0.07, s * 0.265, 0.226), M['body'], bevel=0.004)

# ---------------------------------------------------------------- suction hood + brush (front)
HX, HZ = 0.385, 0.085
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((0.17, 0.54, 0.15, 1)))
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.normal.z < -0.9], context='FACES')
# taper the top to a ridge where the hose leaves
for v in bm.verts:
    if v.co.z > 0: v.co.x *= 0.82
hood = finish('Suction hood', bm, M['hood'], loc=(HX, 0, HZ + 0.007), bevel=0.012, solid=0.006, smooth_it=False)
box('Hood frame top', (0.15, 0.56, 0.012), (HX - 0.005, 0, HZ + 0.083), M['body2'], bevel=0.004)
for s in (1, -1):
    box(f'Hood side plate {s}', (0.17, 0.01, 0.15), (HX, s * 0.276, HZ + 0.007), M['body2'], bevel=0.004)
    pipe(f'Hood arm {s}', [(0.28, s * 0.17, 0.24), (0.33, s * 0.17, 0.2), (0.36, s * 0.17, 0.17)], 0.011, M['steel_d'])
# brush: core + rows of bristle tufts in a helix
cyl('Brush core', 0.032, 0.50, (HX, 0, 0.066), M['brush_core'], axis='Y')
bm = bmesh.new()
for row in range(14):
    yy = -0.235 + row * (0.47 / 13)
    for k in range(18):
        a = 2 * math.pi * k / 18 + row * 0.35
        Mx = Matrix.Translation((math.cos(a) * 0.047, yy, math.sin(a) * 0.047)) @ Matrix.Rotation(-a + math.pi / 2, 4, 'Y')
        bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.006, radius2=0.009, depth=0.03, matrix=Mx)
finish('Brush bristles', bm, M['brush'], loc=(HX, 0, 0.066))
cyl('Brush bearing L', 0.02, 0.02, (HX, 0.262, 0.066), M['steel'], axis='Y')
cyl('Brush bearing R', 0.02, 0.02, (HX, -0.262, 0.066), M['steel'], axis='Y')

# ---------------------------------------------------------------- vortex / slurry pump (front right)
PY = 0.13
cyl('Pump volute', 0.062, 0.05, (0.225, PY, 0.31), M['pump'], axis='X', bevel=0.008)
cyl('Pump inlet flange', 0.036, 0.016, (0.257, PY, 0.31), M['steel'], axis='X')
cyl('Pump motor', 0.046, 0.11, (0.145, PY, 0.31), M['pump'], axis='X', bevel=0.01)
cyl('Pump motor cap', 0.04, 0.02, (0.082, PY, 0.31), M['steel_d'], axis='X', bevel=0.004)
box('Pump foot', (0.16, 0.10, 0.03), (0.17, PY, 0.262), M['body2'], bevel=0.004)
pipe('Suction hose', [(HX + 0.005, 0, HZ + 0.09), (0.37, 0.04, 0.26), (0.31, PY, 0.315), (0.265, PY, 0.31)], 0.03, M['hose'])

# ---------------------------------------------------------------- hydrocyclone (centre)
CX, CY = -0.02, 0.13
cyl('Cyclone cone', 0.014, 0.12, (CX, CY, 0.34), M['steel'], r2=0.055)
cyl('Cyclone barrel', 0.055, 0.07, (CX, CY, 0.435), M['steel'], bevel=0.004)
cyl('Cyclone lid', 0.059, 0.012, (CX, CY, 0.474), M['steel_d'], bevel=0.003)
cyl('Vortex finder', 0.016, 0.03, (CX, CY, 0.494), M['steel'])
cyl('Cyclone apex', 0.016, 0.02, (CX, CY, 0.28), M['steel_d'])
torus('Cyclone band', 0.057, 0.005, (CX, CY, 0.40), M['steel_d'])
for s in (1, -1):
    pipe(f'Cyclone post {s}', [(CX, CY + s * 0.06, 0.25), (CX, CY + s * 0.06, 0.40)], 0.006, M['steel_d'], poly=True)
cyl('Cyclone inlet', 0.017, 0.05, (CX + 0.02, CY + 0.05, 0.445), M['steel'], axis='X')
pipe('Pump to cyclone', [(0.225, PY + 0.04, 0.36), (0.215, PY + 0.05, 0.43), (0.12, CY + 0.05, 0.445), (0.045, CY + 0.05, 0.445)], 0.015, M['steel'])

# ---------------------------------------------------------------- screw conveyor (cyclone underflow → cartridge)
cyl('Conveyor tube', 0.03, 0.24, (-0.15, CY, 0.272), M['clear'], axis='X', caps=False, solid=0.003)
cyl('Conveyor shaft', 0.006, 0.24, (-0.15, CY, 0.272), M['steel'], axis='X')
bm = bmesh.new(); prev = None; N = 220
for i in range(N + 1):
    t = i / N; x = -0.03 - 0.235 * t; a = t * 2 * math.pi * 7
    v_in = bm.verts.new((x, 0.007 * math.cos(a), 0.007 * math.sin(a)))
    v_out = bm.verts.new((x, 0.026 * math.cos(a), 0.026 * math.sin(a)))
    if prev: bm.faces.new((prev[0], prev[1], v_out, v_in))
    prev = (v_in, v_out)
finish('Conveyor flight', bm, M['steel'], loc=(0, CY, 0.272), solid=0.002)
cyl('Conveyor drive', 0.022, 0.04, (-0.005, CY, 0.272), M['body2'], axis='X', bevel=0.003)

# ---------------------------------------------------------------- sealed debris cartridge (rear right)
box('Debris cartridge', (0.16, 0.28, 0.15), (-0.35, 0.12, 0.325), M['cart'], bevel=0.012)
box('Cartridge lid', (0.165, 0.285, 0.018), (-0.35, 0.12, 0.405), M['body2'], bevel=0.005)
pipe('Cartridge handle', [(-0.35, 0.03, 0.414), (-0.35, 0.03, 0.44), (-0.35, 0.21, 0.44), (-0.35, 0.21, 0.414)], 0.007, M['black'], poly=True)
for s in (0.0, 0.24):
    box(f'Cartridge latch {s}', (0.03, 0.02, 0.04), (-0.27, s, 0.39), M['steel'], bevel=0.003)

# ---------------------------------------------------------------- polishing filter (rear left) + return outlet
FY = -0.15
cyl('Filter canister', 0.06, 0.28, (-0.27, FY, 0.315), M['filter'], axis='X', bevel=0.006)
cyl('Filter cartridge', 0.042, 0.25, (-0.27, FY, 0.315), M['filter_core'], axis='X', seg=36)
for xx in (-0.13, -0.41):
    cyl(f'Filter cap {xx}', 0.064, 0.018, (xx, FY, 0.315), M['steel'], axis='X', bevel=0.004)
for xx in (-0.17, -0.37):
    box(f'Filter saddle {xx}', (0.03, 0.12, 0.05), (xx, FY, 0.262), M['body2'], bevel=0.004)
pipe('Overflow to filter', [(CX, CY, 0.505), (CX, CY, 0.53), (-0.05, 0.0, 0.53), (-0.09, FY, 0.45), (-0.11, FY, 0.34), (-0.12, FY, 0.315)], 0.013, M['steel'])
pipe('Clean water return', [(-0.42, FY, 0.315), (-0.46, FY, 0.315), (-0.48, FY, 0.34)], 0.014, M['steel'])
cyl('Return nozzle', 0.016, 0.03, (-0.485, FY, 0.36), M['steel'], r2=0.026)

# ---------------------------------------------------------------- battery pack (front left)
box('Battery pack', (0.30, 0.19, 0.09), (0.08, -0.15, 0.295), M['battery'], bevel=0.012)
box('Battery lid', (0.29, 0.18, 0.012), (0.08, -0.15, 0.344), M['body2'], bevel=0.004)
cyl('Battery gland', 0.012, 0.02, (0.23, -0.10, 0.30), M['black'], axis='X')

# ---------------------------------------------------------------- sensors + lights
for s in (1, -1):
    cyl(f'Front sonar {s}', 0.018, 0.03, (0.465, s * 0.2, 0.17), M['black'], axis='X', bevel=0.003)
    cyl(f'Front sonar face {s}', 0.013, 0.004, (0.481, s * 0.2, 0.17), M['steel_d'], axis='X')
    cyl(f'Lamp {s}', 0.016, 0.02, (0.30, s * 0.28, 0.262), M['black'], axis='X')
    cyl(f'Lamp lens {s}', 0.012, 0.004, (0.311, s * 0.28, 0.262), M['lamp'], axis='X')
pipe('Sensor mast', [(-0.40, -0.285, 0.25), (-0.40, -0.285, 0.44)], 0.011, M['steel_d'], poly=True)
cyl('Depth / turbidity pod', 0.028, 0.07, (-0.40, -0.285, 0.38), M['black'], bevel=0.006)
cyl('Mast sonar', 0.022, 0.025, (-0.40, -0.285, 0.455), M['black'], bevel=0.004)
cyl('Mast sonar face', 0.016, 0.004, (-0.40, -0.285, 0.469), M['steel_d'])
cyl('Status light', 0.008, 0.01, (-0.40, -0.285, 0.476), M['lamp'])
for s in (1, -1):
    cyl(f'Side sonar {s}', 0.016, 0.024, (0.05, s * 0.205, 0.17), M['black'], axis='Y', bevel=0.003)

# ---------------------------------------------------------------- lifting frame + guided docking eye (slide 13)
LX = -0.15
for s in (1, -1):
    pipe(f'Lift upright {s}', [(LX, s * 0.30, 0.25), (LX, s * 0.30, 0.51)], 0.014, M['steel_d'], poly=True)
    box(f'Lift foot {s}', (0.06, 0.04, 0.012), (LX, s * 0.30, 0.256), M['steel_d'], bevel=0.003)
pipe('Lift crossbar', [(LX, 0.30, 0.51), (LX, -0.30, 0.51)], 0.014, M['steel_d'], poly=True)
cyl('Eye post', 0.012, 0.03, (LX, 0, 0.525), M['steel'])
EYE = (LX, 0, 0.565)
torus('Docking eye', 0.03, 0.009, EYE, M['steel'], rot=(math.pi / 2, 0, 0))
cyl('Docking funnel', 0.045, 0.05, (LX, 0, 0.605), M['steel_d'], r2=0.075, caps=False, solid=0.004)
torus('Funnel rim', 0.075, 0.005, (LX, 0, 0.63), M['steel'])

# ---------------------------------------------------------------- winch hook (quick-release, latch)
def build_hook():
    R = 0.045; pts = [(-R, 0, 0.22), (-R, 0, R)]
    for i in range(1, 41):
        a = math.pi + i * (math.radians(225) / 40)
        pts.append((R * math.cos(a), 0, R + R * math.sin(a)))
    pipe('Hook body', pts, 0.013, M['hook'], coll=HOOKC, parent=HOOK_ROOT, poly=True)
    cyl('Hook tip', 0.013, 0.02, pts[-1], M['hook'], coll=HOOKC, parent=HOOK_ROOT)
    pipe('Hook latch', [(-R + 0.01, 0, 0.13), (R * math.cos(math.radians(45)) - 0.004, 0, R + R * math.sin(math.radians(45)) + 0.006)], 0.004, M['steel'], coll=HOOKC, parent=HOOK_ROOT, poly=True)
    cyl('Hook swivel', 0.02, 0.05, (-R, 0, 0.245), M['steel'], coll=HOOKC, parent=HOOK_ROOT, bevel=0.004)
    box('Hook block', (0.07, 0.11, 0.12), (-R, 0, 0.33), M['hook'], bevel=0.012, coll=HOOKC, parent=HOOK_ROOT)
    cyl('Hook sheave', 0.04, 0.02, (-R, 0, 0.33), M['steel'], axis='Y', coll=HOOKC, parent=HOOK_ROOT)
    cyl('Release actuator', 0.016, 0.05, (-R + 0.045, 0, 0.30), M['black'], coll=HOOKC, parent=HOOK_ROOT, bevel=0.003)
    pipe('Winch cable', [(-R, 0, 0.39), (-R, 0, 3.0)], 0.005, M['steel_d'], coll=HOOKC, parent=HOOK_ROOT, poly=True)
build_hook()

# ---------------------------------------------------------------- stage, hatch set, lights, world
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=12)
finish('Studio floor', bm, M['ground'], coll=STAGE, parent=None, smooth_it=False)

slab = box('Hatch slab', (3.2, 3.2, 0.25), (0, 0, 1.125), M['concrete'], bevel=0.0, coll=HATCH, parent=None)
cut = box('Hatch opening (1 m × 1 m)', (1.0, 1.0, 0.6), (0, 0, 1.125), M['concrete'], bevel=0.0, coll=HATCH, parent=None)
bo = slab.modifiers.new('hatch', 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = cut
cut.hide_render = True; cut.hide_viewport = True
for s in (1, -1):
    box(f'Hatch rim x{s}', (1.08, 0.04, 0.05), (0, s * 0.52, 1.275), M['steel_d'], bevel=0.004, coll=HATCH, parent=None)
    box(f'Hatch rim y{s}', (0.04, 1.08, 0.05), (s * 0.52, 0, 1.275), M['steel_d'], bevel=0.004, coll=HATCH, parent=None)

CTX = bpy.data.collections.new('ReservoirContext'); scene.collection.children.link(CTX)
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=14)
finish('Reservoir floor', bm, M['reservoir_floor'], coll=CTX, parent=None, smooth_it=False)
for px in (-3.0, 0.4, 3.8):
    for py in (-2.4, 2.4):
        box(f'Pillar {px} {py}', (0.45, 0.45, 6.0), (px, py, 3.0), M['pillar'], bevel=0.01, coll=CTX, parent=None)
box('Back wall', (0.4, 16, 6.0), (-7.0, 0, 3.0), M['pillar'], bevel=0.0, coll=CTX, parent=None)
# sediment layer patches on the floor ahead (to be cleaned) and a cleaned lane behind
box('Sediment ahead', (3.0, 0.62, 0.006), (2.0, 0, 0.003), M['sed'], bevel=0.0, coll=CTX, parent=None)
wv = bpy.data.materials.new('Water volume'); wv.use_nodes = True
nt = wv.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF'])
pv = nt.nodes.new('ShaderNodeVolumePrincipled'); pv.inputs['Color'].default_value = (*lin('#4FA9B8'), 1)
pv.inputs['Density'].default_value = 0.11; pv.inputs['Absorption Color'].default_value = (*lin('#2E8C9E'), 1)
nt.links.new(pv.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
water = box('Water volume', (16, 16, 4.2), (0, 0, 2.1), wv, bevel=0.0, coll=CTX, parent=None)
ld = bpy.data.lights.new('Hatch light', 'SPOT'); ld.energy = 6000; ld.spot_size = math.radians(70); ld.color = lin('#DDF4FF'); ld.shadow_soft_size = 0.4
ob = bpy.data.objects.new('Hatch light', ld); CTX.objects.link(ob); ob.location = (0.6, -0.8, 5.5); ob.rotation_euler = (math.radians(8), 0, 0)
ld = bpy.data.lights.new('Ambient fill', 'AREA'); ld.energy = 900; ld.size = 8; ld.color = lin('#7FC7D6')
ob = bpy.data.objects.new('Ambient fill', ld); CTX.objects.link(ob); ob.location = (0, 0, 4.1)

world = bpy.data.worlds.new('World'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*lin('#EEF0F2'), 1); bg.inputs['Strength'].default_value = 0.7

def light(name, kind, loc, energy, size=1.0, target=(0, 0, 0.25), color='#FFFFFF'):
    ld = bpy.data.lights.new(name, kind); ld.energy = energy; ld.color = lin(color)
    if kind == 'AREA': ld.size = size
    ob = bpy.data.objects.new(name, ld); STAGE.objects.link(ob); ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return ob
light('Key', 'AREA', (1.8, -1.6, 2.4), 450, 2.0)
light('Fill', 'AREA', (-2.2, -1.2, 1.4), 160, 2.5, color='#EAF2FF')
light('Rim', 'AREA', (-1.2, 2.2, 2.0), 320, 1.5)

# ---------------------------------------------------------------- render settings
scene.render.engine = 'CYCLES'
try:
    pr = bpy.context.preferences.addons['cycles'].preferences
    pr.compute_device_type = 'METAL'; pr.get_devices()
    for d in pr.devices: d.use = True
    scene.cycles.device = 'GPU'
except Exception as e:
    print('GPU setup failed, CPU render:', e)
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = RES
scene.render.film_transparent = False
scene.view_settings.view_transform = 'AgX'
for _lk in ('AgX - Punchy', 'AgX - Medium High Contrast'):
    try:
        scene.view_settings.look = _lk; break
    except Exception:
        pass
scene.render.image_settings.file_format = 'PNG'

def cam(name, loc, target, lens=50, ortho=None, rot=None):
    cd = bpy.data.cameras.new(name); cd.lens = lens
    if ortho: cd.type = 'ORTHO'; cd.ortho_scale = ortho
    cd.dof.use_dof = False
    ob = bpy.data.objects.new(name, cd); STAGE.objects.link(ob); ob.location = loc
    ob.rotation_euler = rot if rot else (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return ob

def show(coll, on):
    coll.hide_render = not on

def set_hook(mode):
    if mode == 'off':
        show(HOOKC, False); return
    show(HOOKC, True)
    if mode == 'approach':
        HOOK_ROOT.location = (EYE[0], 0, EYE[2] + 0.12)
    elif mode == 'engaged':
        HOOK_ROOT.location = (EYE[0], 0, EYE[2] + 0.03 - 0.004)
    HOOK_ROOT.rotation_euler = (0, 0, math.pi / 2)  # hook plane faces the camera side; bowl passes through the eye

VIEWS_DEF = {
    'hero':  dict(cam=('C_hero', (1.55, -1.35, 0.85), (0.0, 0, 0.24), 50), hook='off', hatch=False),
    'side':  dict(cam=('C_side', (0.0, -2.7, 0.32), (0.0, 0, 0.28), 70), hook='off', hatch=False),
    'rear':  dict(cam=('C_rear', (-1.5, 1.35, 0.95), (0.0, 0, 0.25), 50), hook='off', hatch=False),
    'top':   dict(cam=('C_top', (0.0, 0.0, 2.6), None, 50, None, (0, 0, 0)), hook='off', hatch=False),
    'parts': dict(cam=('C_parts', (0.95, -0.95, 1.25), (-0.03, 0, 0.3), 45), hook='off', hatch=False),
    'hook':  dict(cam=('C_hook', (0.85, -1.25, 1.12), (LX, 0, 0.80), 50), hook='approach', hatch=False),
    'brush': dict(cam=('C_brush', (1.05, -0.42, 0.16), (0.39, 0, 0.08), 50), hook='off', hatch=False),
    'context': dict(cam=('C_context', (1.9, -1.55, 0.55), (0.1, 0, 0.25), 32), hook='off', hatch=False, ctx=True),
    'hatch': dict(cam=('C_hatch', (1.7, -2.0, 2.6), (0, 0, 1.1), 40), hook='engaged', hatch=True),
}

for v in VIEWS:
    d = VIEWS_DEF[v]; c = d['cam']
    C = cam(c[0], c[1], c[2], c[3], *(c[4:] if len(c) > 4 else ()))
    scene.camera = C
    set_hook(d['hook'])
    show(HATCH, d['hatch']); show(CTX, d.get('ctx', False))
    for _n in ('Key', 'Fill', 'Rim'): bpy.data.objects[_n].hide_render = d.get('ctx', False)
    bg.inputs['Strength'].default_value = 0.03 if d.get('ctx') else 0.7
    floor = bpy.data.objects['Studio floor']; floor.hide_render = d['hatch'] or d.get('ctx', False)
    ROOT.location = (0, 0, 0.82) if d['hatch'] else (0, 0, 0)
    if d['hatch']:
        HOOK_ROOT.location = (EYE[0], 0, 0.82 + EYE[2] + 0.03 - 0.004)
    scene.render.filepath = os.path.join(OUT, f'{v}.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', v)

ROOT.location = (0, 0, 0)
set_hook('approach'); show(HATCH, False); show(CTX, False)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'robot_C1_v1.blend'))
print('SAVED')
