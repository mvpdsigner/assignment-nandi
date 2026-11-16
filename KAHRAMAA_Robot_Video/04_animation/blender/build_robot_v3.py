"""
KAHRAMAA reservoir-cleaning robot · Concept C1 (battery-powered tracked brush–hydrocyclone crawler) · model v3
v3 (client review 1): sealed clear polycarbonate cover over the deck components (bolted steel flange, black gasket,
clamp straps, bulkhead glands where the hose / return pipe / lifting post pass through), sensor mast moved outside,
whole robot scaled to the 900 x 650 mm spec footprint so it clears the 1 m x 1 m hatch on all sides.
Look follows the client's reference images (slides 10–13): silver half-round suction hood over a dense blue
roller brush, grey + maroon housings, blue vortex pump with black finned motor, clear hydrocyclone / filter /
screw-conveyor bodies with steel flanges, A-frame with bell guide + eye bolt, silver hook with red safety latch.

Run:  Blender -b -P build_robot_v3.py -- [--views hero,side,...] [--samples 128] [--res 1920x1080]
Axes: +X = front (suction hood), +Y = left, +Z = up. Units = metres. Ground at z = 0.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'renders', 'model_v3')
os.makedirs(OUT, exist_ok=True)
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d): return argv[argv.index(n) + 1] if n in argv else d
VIEWS = [v for v in arg('--views', 'hero,side,rear,top,parts,brush,hook,hatch,hatch_top,cover,context').split(',') if v]
SAMPLES = int(arg('--samples', '128'))
RES = [int(v) for v in arg('--res', '1920x1080').split('x')]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
def coll(name):
    c = bpy.data.collections.new(name); scene.collection.children.link(c); return c
ROBOT, HOOKC, STAGE, HATCH, CTX = coll('Robot'), coll('Hook'), coll('Studio'), coll('HatchSet'), coll('ReservoirContext')

# ------------------------------------------------------------------ materials
def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)

def mat(name, hexcol, metal=0.0, rough=0.5, transm=0.0, ior=1.45, coat=0.0, emit=0.0, alpha=1.0, aniso=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(hexcol), 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    b.inputs['IOR'].default_value = ior
    if transm: b.inputs['Transmission Weight'].default_value = transm
    if coat: b.inputs['Coat Weight'].default_value = coat
    if aniso: b.inputs['Anisotropic'].default_value = aniso
    if emit:
        b.inputs['Emission Color'].default_value = (*lin(hexcol), 1); b.inputs['Emission Strength'].default_value = emit
    if alpha < 1: b.inputs['Alpha'].default_value = alpha
    return m

def noisy(name, c1, c2, scale=6.0, rough=0.9, bump=0.15, metal=0.0, caustic=None):
    """Base colour = noise blend of two colours, with bump. Optional fake caustic emission (Voronoi edges)."""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    b = N['Principled BSDF']; b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    tc = N.new('ShaderNodeTexCoord')
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 8
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    cr = N.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = (*lin(c1), 1); cr.color_ramp.elements[1].color = (*lin(c2), 1)
    cr.color_ramp.elements[0].position = 0.35; cr.color_ramp.elements[1].position = 0.7
    L.new(nz.outputs['Fac'], cr.inputs['Fac']); L.new(cr.outputs['Color'], b.inputs['Base Color'])
    bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
    nz2 = N.new('ShaderNodeTexNoise'); nz2.inputs['Scale'].default_value = scale * 12; nz2.inputs['Detail'].default_value = 4
    L.new(tc.outputs['Object'], nz2.inputs['Vector'])
    L.new(nz2.outputs['Fac'], bp.inputs['Height']); L.new(bp.outputs['Normal'], b.inputs['Normal'])
    if caustic:
        vo = N.new('ShaderNodeTexVoronoi'); vo.feature = 'DISTANCE_TO_EDGE'; vo.inputs['Scale'].default_value = caustic
        vo.inputs['Randomness'].default_value = 0.85
        L.new(tc.outputs['Object'], vo.inputs['Vector'])
        cr2 = N.new('ShaderNodeValToRGB'); cr2.color_ramp.elements[0].position = 0.0; cr2.color_ramp.elements[1].position = 0.035
        cr2.color_ramp.elements[0].color = (*lin('#BFF3FF'), 1); cr2.color_ramp.elements[1].color = (0, 0, 0, 1)
        L.new(vo.outputs['Distance'], cr2.inputs['Fac'])
        L.new(cr2.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = 0.35
    return m

M = {
    'alu': mat('Aluminium hood', '#C9CED3', metal=1, rough=0.28, aniso=0.4),
    'body': mat('Body light grey', '#BFC5CA', rough=0.4, coat=0.15),
    'body2': mat('Body dark grey', '#3E4449', rough=0.42),
    'maroon': mat('Housing maroon', '#5A0B1D', rough=0.38, coat=0.3),
    'rubber': mat('Track rubber', '#18191B', rough=0.85),
    'steel': mat('Steel', '#C4CAD0', metal=1, rough=0.2),
    'steel_d': mat('Steel dark', '#6C737A', metal=1, rough=0.32),
    'brush': mat('Brush bristles', '#1E5FC8', rough=0.55),
    'brush_core': mat('Brush core', '#173E7A', rough=0.4),
    'pump': mat('Pump blue', '#1F4FA3', metal=0.35, rough=0.32, coat=0.5),
    'motor': mat('Motor black', '#1D2024', metal=0.3, rough=0.45),
    'clear': mat('Clear acrylic', '#EEF6FA', rough=0.03, transm=1.0, ior=1.49),
    'pleat': mat('Filter pleats', '#F2F4F6', rough=0.75),
    'blue_flange': mat('Blue flange', '#2459B5', metal=0.4, rough=0.3, coat=0.4),
    'cart': mat('Cartridge grey', '#2F3438', rough=0.4, coat=0.2),
    'hose': mat('Corrugated hose', '#35393E', rough=0.55),
    'black': mat('Black plastic', '#121314', rough=0.45),
    'latch': mat('Latch red', '#B0161A', rough=0.35, coat=0.4),
    'lamp': mat('Lamp', '#FFFFFF', emit=14),
    'sed': mat('Sediment', '#7A5230', rough=0.95),
    'studio': mat('Studio floor', '#D3D6D9', rough=0.7),
    'concrete': noisy('Concrete', '#9C9A94', '#B8B5AE', scale=3.0, bump=0.25),
    'res_floor': noisy('Reservoir floor', '#7D7E79', '#9A8F7E', scale=1.2, bump=0.2, caustic=5.0),
    'pillar': noisy('Reservoir pillar', '#9A988F', '#B3AFA6', scale=2.0, bump=0.2),
    'rail': mat('Rail yellow', '#E8B100', rough=0.4),
    'gasket': mat('Gasket rubber', '#0E0F10', rough=0.7),
}

def thin_clear(name, refl=0.5):
    # thin polycarbonate panel: see-through without refraction blur; damped fresnel reflections + faint cyan edge tint
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    N.remove(N['Principled BSDF']); out = N['Material Output']
    tr = N.new('ShaderNodeBsdfTransparent'); tr.inputs['Color'].default_value = (*lin('#FAFDFE'), 1)
    tr2 = N.new('ShaderNodeBsdfTransparent'); tr2.inputs['Color'].default_value = (*lin('#CFE8F0'), 1)
    gl = N.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = 0.02
    fr = N.new('ShaderNodeFresnel'); fr.inputs['IOR'].default_value = 1.45
    lw = N.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.15
    m1 = N.new('ShaderNodeMixShader'); L.new(lw.outputs['Facing'], m1.inputs[0]); L.new(tr.outputs[0], m1.inputs[1]); L.new(tr2.outputs[0], m1.inputs[2])
    k = N.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = refl; L.new(fr.outputs[0], k.inputs[0])
    m2 = N.new('ShaderNodeMixShader'); L.new(k.outputs[0], m2.inputs[0]); L.new(m1.outputs[0], m2.inputs[1]); L.new(gl.outputs[0], m2.inputs[2])
    L.new(m2.outputs[0], out.inputs['Surface'])
    return m
M['cover'] = thin_clear('Clear polycarbonate cover')

ROOT = bpy.data.objects.new('ROBOT_ROOT', None); ROBOT.objects.link(ROOT)
S = 0.85   # model units -> spec size (~0.86 m long x 0.58 m wide overall; spec 900 x 650 mm)
DX = 0.0225   # centres the robot footprint under the winch / in the hatch (bbox centre is 2.6 cm behind the origin)
HOOK_ROOT = bpy.data.objects.new('HOOK_ROOT', None); HOOKC.objects.link(HOOK_ROOT)

# ------------------------------------------------------------------ geometry helpers
def finish(name, bm, material, c=ROBOT, parent=ROOT, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, solid=0.0, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, me); c.objects.link(ob); ob.data.materials.append(material)
    ob.location = loc; ob.rotation_euler = rot
    if parent: ob.parent = parent
    if solid:
        s = ob.modifiers.new('solid', 'SOLIDIFY'); s.thickness = solid; s.offset = 0
    if bevel:
        b = ob.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = 3; b.limit_method = 'ANGLE'; b.harden_normals = True
    return ob

def box(name, size, loc, material, bevel=0.006, rot=(0, 0, 0), c=ROBOT, parent=ROOT):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((*size, 1)))
    return finish(name, bm, material, c, parent, loc, rot, bevel=bevel, smooth=False)

AX = {'Z': Matrix.Identity(4), 'X': Matrix.Rotation(math.pi / 2, 4, 'Y'), 'Y': Matrix.Rotation(math.pi / 2, 4, 'X')}
def cyl(name, r, depth, loc, material, axis='Z', r2=None, seg=48, bevel=0.0, caps=True, c=ROBOT, parent=ROOT, solid=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=depth, matrix=AX[axis])
    return finish(name, bm, material, c, parent, loc, bevel=bevel, solid=solid)

def torus(name, R, r, loc, material, rot=(0, 0, 0), c=ROBOT, parent=ROOT, n1=48, n2=14):
    bm = bmesh.new()
    for i in range(n1):
        a = 2 * math.pi * i / n1
        for j in range(n2):
            b = 2 * math.pi * j / n2
            bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))
    bm.verts.ensure_lookup_table(); V = bm.verts
    for i in range(n1):
        for j in range(n2):
            bm.faces.new((V[i * n2 + j], V[((i + 1) % n1) * n2 + j], V[((i + 1) % n1) * n2 + (j + 1) % n2], V[i * n2 + (j + 1) % n2]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return finish(name, bm, material, c, parent, loc, rot)

def catmull(pts, n=12):
    P = [Vector(p) for p in pts]; P = [P[0]] + P + [P[-1]]; out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2]); return out

def pipe(name, pts, r, material, c=ROBOT, parent=ROOT, smooth_path=True, ribs=0.0):
    path = catmull(pts) if smooth_path and len(pts) > 2 else [Vector(p) for p in pts]
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = r; cu.bevel_resolution = 6; cu.use_fill_caps = True
    sp = cu.splines.new('POLY'); sp.points.add(len(path) - 1)
    for p, co in zip(sp.points, path): p.co = (*co, 1)
    ob = bpy.data.objects.new(name, cu); c.objects.link(ob); cu.materials.append(material)
    if parent: ob.parent = parent
    if ribs:   # corrugation rings along the path
        bm = bmesh.new(); acc = 0.0
        for a, b in zip(path[:-1], path[1:]):
            seg = (b - a); L = seg.length
            if L == 0: continue
            d = seg / L; t = 0.0
            while acc + (L - t) >= ribs:
                t += ribs - acc; acc = 0.0
                p = a + d * t
                rotm = d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
                Mx = Matrix.Translation(p) @ rotm
                bmesh.ops.create_cone(bm, cap_ends=False, segments=20, radius1=r * 1.12, radius2=r * 1.12, depth=ribs * 0.45, matrix=Mx)
            acc += L - t
        finish(name + ' ribs', bm, material, c, parent)
    return ob

def flange(name, r, loc, axis, material=None, bolts=6):
    cyl(name, r, 0.012, loc, material or M['steel'], axis=axis, bevel=0.002)
    bm = bmesh.new()
    for k in range(bolts):
        a = 2 * math.pi * k / bolts
        if axis == 'X': off = (0.008, math.cos(a) * r * 0.8, math.sin(a) * r * 0.8); ax = AX['X']
        elif axis == 'Y': off = (math.cos(a) * r * 0.8, 0.008, math.sin(a) * r * 0.8); ax = AX['Y']
        else: off = (math.cos(a) * r * 0.8, math.sin(a) * r * 0.8, 0.008); ax = AX['Z']
        bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.0045, radius2=0.0045, depth=0.008, matrix=Matrix.Translation(off) @ ax)
    finish(name + ' bolts', bm, M['steel_d'], loc=loc)

# ------------------------------------------------------------------ tracks (two continuous rubber tracks)
TR_L, TR_R, TR_W, TR_T = 0.74, 0.10, 0.12, 0.022
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
    y0 = side * TR_Y; P = stadium(TR_L, TR_R); bm = bmesh.new(); ring = []
    for x, z, nx, nz in P:
        ring.append((bm.verts.new((x, -TR_W / 2, z)), bm.verts.new((x, TR_W / 2, z)),
                     bm.verts.new((x - nx * TR_T, -TR_W / 2, z - nz * TR_T)), bm.verts.new((x - nx * TR_T, TR_W / 2, z - nz * TR_T))))
    n = len(ring)
    for k in range(n):
        a, b = ring[k], ring[(k + 1) % n]
        bm.faces.new((a[0], b[0], b[1], a[1])); bm.faces.new((a[2], a[3], b[3], b[2]))
        bm.faces.new((a[0], a[2], b[2], b[0])); bm.faces.new((a[1], b[1], b[3], a[3]))
    for k in range(0, n, 2):
        x, z, nx, nz = P[k]; th = math.atan2(nx, nz)
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x + nx * 0.007, 0, z + nz * 0.007)) @ Matrix.Rotation(th, 4, 'Y') @ Matrix.Diagonal((0.016, TR_W * 1.02, 0.014, 1)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    finish(f'Track {side}', bm, M['rubber'], loc=(TR_X, y0, TR_R), smooth=False)
    a = TR_L / 2 - TR_R
    for i, xx in enumerate((TR_X - a, TR_X + a)):
        cyl(f'Sprocket {side}{i}', TR_R - TR_T - 0.004, TR_W * 0.86, (xx, y0, TR_R), M['body2'], axis='Y', bevel=0.004)
        cyl(f'Hub {side}{i}', 0.03, TR_W * 0.94, (xx, y0, TR_R), M['steel'], axis='Y')
    for j in range(3):
        xx = TR_X - a + (j + 1) * (2 * a) / 4
        cyl(f'Road wheel {side}{j}', 0.042, TR_W * 0.8, (xx, y0, TR_T + 0.044), M['body2'], axis='Y', bevel=0.003)
        cyl(f'Road hub {side}{j}', 0.016, TR_W * 0.86, (xx, y0, TR_T + 0.044), M['steel'], axis='Y')
    box(f'Track frame {side}', (2 * a, 0.03, 0.05), (TR_X, y0, TR_R), M['body2'], bevel=0.008)
    box(f'Track guard {side}', (0.62, 0.012, 0.07), (TR_X, side * (TR_Y + TR_W / 2 + 0.008), 0.175), M['maroon'], bevel=0.006)
track(1); track(-1)

# ------------------------------------------------------------------ hull + deck
box('Hull', (0.66, 0.40, 0.17), (-0.07, 0, 0.14), M['body2'], bevel=0.02)
box('Deck', (0.78, 0.66, 0.03), (-0.09, 0, 0.235), M['body'], bevel=0.012)
box('Deck trim', (0.785, 0.665, 0.008), (-0.09, 0, 0.217), M['body2'], bevel=0.003)

# ------------------------------------------------------------------ suction hood (half-round aluminium cowling) + roller brush
HX, HZ, HR, HW = 0.39, 0.07, 0.088, 0.56
A0, A1 = math.radians(12), math.radians(208)
bm = bmesh.new(); rows = []
for i in range(41):
    a = A0 + (A1 - A0) * i / 40
    rows.append((bm.verts.new((HR * math.cos(a), -HW / 2, HR * math.sin(a))), bm.verts.new((HR * math.cos(a), HW / 2, HR * math.sin(a)))))
for a, b in zip(rows[:-1], rows[1:]): bm.faces.new((a[0], b[0], b[1], a[1]))
for side in (0, 1):   # end caps (flat plates following the arc)
    c = bm.verts.new((0, (side - 0.5) * HW, 0))
    for a, b in zip(rows[:-1], rows[1:]): bm.faces.new((c, a[side], b[side]) if side else (c, b[side], a[side]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
finish('Suction hood', bm, M['alu'], loc=(HX, 0, HZ), solid=0.006, bevel=0.003)
box('Hood lip', (0.012, HW + 0.01, 0.01), (HX + HR * math.cos(A0), 0, HZ + HR * math.sin(A0)), M['rubber'], bevel=0.002)
cyl('Hood outlet', 0.04, 0.03, (HX - 0.01, 0, HZ + HR + 0.01), M['alu'], bevel=0.003)
flange('Hood outlet flange', 0.05, (HX - 0.01, 0, HZ + HR + 0.025), 'Z')
for s in (1, -1):
    cyl(f'Headlight {s}', 0.018, 0.02, (HX + 0.06, s * 0.2, HZ + 0.06), M['black'], axis='X', bevel=0.003)
    cyl(f'Headlight lens {s}', 0.013, 0.004, (HX + 0.071, s * 0.2, HZ + 0.06), M['lamp'], axis='X')
    pipe(f'Hood arm {s}', [(0.28, s * 0.2, 0.235), (0.33, s * 0.2, 0.2), (0.36, s * 0.2, 0.15)], 0.011, M['steel_d'])
    cyl(f'Front sonar {s}', 0.016, 0.026, (HX + 0.035, s * 0.12, HZ + 0.085), M['black'], axis='X', bevel=0.003)
core = cyl('Brush core', 0.03, 0.52, (HX, 0, HZ - 0.008), M['brush_core'], axis='Y', caps=False, seg=40)
import random as _r; _r.seed(3)
bm = bmesh.new()
for k in range(7000):   # individual bristles: thin strands standing out radially from the core
    yy = (_r.random() - 0.5) * 0.5; a = _r.random() * 2 * math.pi; L = 0.03 + _r.random() * 0.006
    tilt = (_r.random() - 0.5) * 0.25
    Mx = (Matrix.Translation((0, yy, 0)) @ Matrix.Rotation(-a, 4, 'Y') @ Matrix.Rotation(tilt, 4, 'X')
          @ Matrix.Translation((0, 0, 0.029 + L / 2)) @ Matrix.Diagonal((0.0018, 0.0018, L, 1)))
    bmesh.ops.create_cube(bm, size=1.0, matrix=Mx)
finish('Brush bristles', bm, M['brush'], loc=(HX, 0, HZ - 0.008), smooth=False)
for s in (1, -1):
    cyl(f'Brush end {s}', 0.03, 0.012, (HX, s * 0.266, HZ - 0.008), M['steel'], axis='Y')

# ------------------------------------------------------------------ vortex / slurry pump (front right)
PY, PZ = 0.13, 0.315
cyl('Pump volute', 0.064, 0.05, (0.215, PY, PZ), M['pump'], axis='X', bevel=0.01)
cyl('Pump cover', 0.058, 0.02, (0.247, PY, PZ), M['pump'], axis='X', bevel=0.006)
flange('Pump inlet flange', 0.04, (0.262, PY, PZ), 'X')
cyl('Pump discharge', 0.022, 0.06, (0.215, PY, PZ + 0.085), M['pump'])
flange('Pump discharge flange', 0.032, (0.215, PY, PZ + 0.118), 'Z')
cyl('Motor body', 0.05, 0.11, (0.13, PY, PZ), M['motor'], axis='X', bevel=0.008)
bm = bmesh.new()
for k in range(16):
    a = 2 * math.pi * k / 16
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((0, math.cos(a) * 0.053, math.sin(a) * 0.053)) @ Matrix.Rotation(a, 4, 'X') @ Matrix.Diagonal((0.1, 0.004, 0.01, 1)))
finish('Motor fins', bm, M['motor'], loc=(0.13, PY, PZ))
box('Motor terminal box', (0.05, 0.05, 0.03), (0.13, PY, PZ + 0.06), M['motor'], bevel=0.004)
cyl('Motor fan cap', 0.046, 0.02, (0.066, PY, PZ), M['steel_d'], axis='X', bevel=0.004)
box('Pump base', (0.2, 0.11, 0.02), (0.16, PY, 0.26), M['pump'], bevel=0.004)
pipe('Suction hose', [(HX - 0.01, 0, HZ + HR + 0.035), (0.37, 0.03, 0.25), (0.32, PY, PZ + 0.01), (0.275, PY, PZ)], 0.03, M['hose'], ribs=0.016)

# ------------------------------------------------------------------ hydrocyclone (clear body, blue top flange)
CX, CY = -0.02, 0.13
cyl('Cyclone cone', 0.015, 0.13, (CX, CY, 0.345), M['clear'], r2=0.055, caps=False, solid=0.003)
cyl('Cyclone barrel', 0.055, 0.07, (CX, CY, 0.445), M['clear'], caps=False, solid=0.003)
cyl('Cyclone top flange', 0.064, 0.014, (CX, CY, 0.485), M['blue_flange'], bevel=0.003)
flange('Cyclone mid flange', 0.062, (CX, CY, 0.41), 'Z')
cyl('Vortex finder', 0.017, 0.035, (CX, CY, 0.505), M['blue_flange'])
cyl('Cyclone apex', 0.018, 0.022, (CX, CY, 0.272), M['steel'])
cyl('Cyclone inlet', 0.017, 0.05, (CX + 0.022, CY + 0.042, 0.455), M['steel'], axis='X')
flange('Cyclone inlet flange', 0.026, (CX + 0.05, CY + 0.042, 0.455), 'X')
for s in (1, -1):
    pipe(f'Cyclone post {s}', [(CX, CY + s * 0.064, 0.25), (CX, CY + s * 0.064, 0.41)], 0.006, M['steel_d'], smooth_path=False)
pipe('Pump to cyclone', [(0.215, PY, PZ + 0.125), (0.2, PY + 0.02, 0.455), (0.12, CY + 0.042, 0.47), (0.056, CY + 0.042, 0.455)], 0.016, M['steel'])

# ------------------------------------------------------------------ screw conveyor (clear tube, steel flight)
cyl('Conveyor tube', 0.03, 0.24, (-0.15, CY, 0.272), M['clear'], axis='X', caps=False, solid=0.003)
flange('Conveyor flange front', 0.038, (-0.03, CY, 0.272), 'X')
flange('Conveyor flange rear', 0.038, (-0.27, CY, 0.272), 'X')
cyl('Conveyor shaft', 0.006, 0.24, (-0.15, CY, 0.272), M['steel'], axis='X')
bm = bmesh.new(); prev = None; N = 260
for i in range(N + 1):
    t = i / N; x = -0.035 - 0.23 * t; a = t * 2 * math.pi * 7
    vi = bm.verts.new((x, 0.007 * math.cos(a), 0.007 * math.sin(a))); vo = bm.verts.new((x, 0.026 * math.cos(a), 0.026 * math.sin(a)))
    if prev: bm.faces.new((prev[0], prev[1], vo, vi))
    prev = (vi, vo)
finish('Conveyor flight', bm, M['steel'], loc=(0, CY, 0.272), solid=0.002)

# ------------------------------------------------------------------ sealed debris cartridge (dark housing, clear window, latches)
box('Cartridge body', (0.16, 0.28, 0.15), (-0.35, 0.12, 0.325), M['cart'], bevel=0.012)
box('Cartridge window', (0.004, 0.22, 0.09), (-0.432, 0.12, 0.33), M['clear'], bevel=0.002)
box('Cartridge sediment', (0.003, 0.2, 0.05), (-0.428, 0.12, 0.305), M['sed'], bevel=0.0)
box('Cartridge lid', (0.17, 0.29, 0.02), (-0.35, 0.12, 0.408), M['body2'], bevel=0.005)
pipe('Cartridge handle', [(-0.35, 0.04, 0.418), (-0.35, 0.04, 0.445), (-0.35, 0.2, 0.445), (-0.35, 0.2, 0.418)], 0.007, M['black'], smooth_path=False)
for s in (0.02, 0.22):
    box(f'Cartridge latch {s}', (0.012, 0.03, 0.05), (-0.434, s, 0.39), M['steel'], bevel=0.003)

# ------------------------------------------------------------------ polishing filter (clear canister, pleated cartridge, flanged ends)
FY, FZ = -0.15, 0.315
cyl('Filter canister', 0.058, 0.26, (-0.28, FY, FZ), M['clear'], axis='X', caps=False, solid=0.003)
cyl('Filter cartridge', 0.042, 0.23, (-0.28, FY, FZ), M['pleat'], axis='X', seg=64)
bm = bmesh.new()
for k in range(40):
    a = 2 * math.pi * k / 40
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((0, math.cos(a) * 0.044, math.sin(a) * 0.044)) @ Matrix.Rotation(a, 4, 'X') @ Matrix.Diagonal((0.23, 0.003, 0.006, 1)))
finish('Filter pleats', bm, M['pleat'], loc=(-0.28, FY, FZ))
for xx in (-0.14, -0.42):
    cyl(f'Filter end {xx}', 0.066, 0.02, (xx, FY, FZ), M['steel'], axis='X', bevel=0.004)
    cyl(f'Filter band {xx}', 0.06, 0.012, (xx + (0.018 if xx > -0.3 else -0.018), FY, FZ), M['blue_flange'], axis='X')
    flange(f'Filter flange {xx}', 0.064, (xx, FY, FZ), 'X', bolts=8)
for xx in (-0.19, -0.37):
    box(f'Filter saddle {xx}', (0.03, 0.12, 0.05), (xx, FY, 0.262), M['body2'], bevel=0.004)
pipe('Overflow to filter', [(CX, CY, 0.523), (CX, CY, 0.545), (-0.02, -0.02, 0.54), (-0.03, FY, 0.47), (-0.06, FY, 0.34), (-0.13, FY, FZ)], 0.014, M['steel'])
pipe('Clean water return', [(-0.43, FY, FZ), (-0.485, FY, FZ), (-0.505, FY, FZ + 0.03)], 0.015, M['steel'])
cyl('Return outlet', 0.017, 0.03, (-0.508, FY, FZ + 0.055), M['steel'], r2=0.026)

# ------------------------------------------------------------------ battery pack (sealed maroon housing)
box('Battery pack', (0.22, 0.19, 0.09), (0.12, -0.15, 0.295), M['maroon'], bevel=0.012)
box('Battery lid', (0.21, 0.18, 0.012), (0.12, -0.15, 0.344), M['body2'], bevel=0.004)
cyl('Battery gland', 0.012, 0.02, (0.235, -0.10, 0.30), M['black'], axis='X')
box('Electronics box', (0.07, 0.10, 0.07), (-0.04, -0.255, 0.285), M['body2'], bevel=0.008)

# ------------------------------------------------------------------ sensors + status
SMX, SMY = -0.505, -0.26   # outside the cover, bracketed off the rear-left corner (client mock-up)
box('Sensor bracket', (0.06, 0.05, 0.02), (-0.485, SMY, 0.225), M['steel_d'], bevel=0.003)
pipe('Sensor mast', [(SMX, SMY, 0.215), (SMX, SMY, 0.50)], 0.011, M['steel_d'], smooth_path=False)
cyl('Depth / turbidity pod', 0.028, 0.07, (SMX, SMY, 0.40), M['black'], bevel=0.006)
cyl('Mast sonar', 0.022, 0.025, (SMX, SMY, 0.475), M['black'], bevel=0.004)
cyl('Status light', 0.008, 0.01, (SMX, SMY, 0.494), M['lamp'])
for s in (1, -1):
    cyl(f'Side sonar {s}', 0.016, 0.024, (0.05, s * 0.205, 0.17), M['black'], axis='Y', bevel=0.003)

# ------------------------------------------------------------------ A-frame + bell guide + eye bolt (guided docking eye)
# ------------------------------------------------------------------ sealed clear cover (v3)
CV_X0, CV_X1, CV_W, CV_B, CV_T, CV_R = -0.455, 0.28, 0.63, 0.262, 0.585, 0.055
cvx, cvl = (CV_X0 + CV_X1) / 2, CV_X1 - CV_X0
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((cvx, 0, (CV_B + CV_T) / 2)) @ Matrix.Diagonal((cvl, CV_W, CV_T - CV_B, 1)))
bottom = [f for f in bm.faces if f.normal.z < -0.9][0]
bev = [e for e in bm.edges if e not in bottom.edges]
bmesh.ops.bevel(bm, geom=bev, offset=CV_R, segments=10, profile=0.5, affect='EDGES')
bottom = [f for f in bm.faces if f.normal.z < -0.9 and f.calc_center_median().z < CV_B + 1e-4]
bmesh.ops.delete(bm, geom=bottom, context='FACES_ONLY')
shell = finish('Clear cover shell', bm, M['cover'], solid=0.004)
shell.visible_shadow = False   # keep the components inside lit; the shell still reflects / refracts
FW = 0.026   # bolted base flange + gasket around the whole footprint
for nm, sz, lc in (('front', (FW, CV_W + 2 * FW, 0.014), (CV_X1 + FW / 2 - 0.004, 0, 0.257)),
                   ('rear', (FW, CV_W + 2 * FW, 0.014), (CV_X0 - FW / 2 + 0.004, 0, 0.257)),
                   ('left', (cvl, FW, 0.014), (cvx, CV_W / 2 + FW / 2 - 0.004, 0.257)),
                   ('right', (cvl, FW, 0.014), (cvx, -CV_W / 2 - FW / 2 + 0.004, 0.257))):
    box(f'Cover flange {nm}', sz, lc, M['steel'], bevel=0.002)
box('Cover gasket', (cvl + 0.012, CV_W + 0.012, 0.006), (cvx, 0, 0.251), M['gasket'], bevel=0.002)
bm = bmesh.new()
def bolt(x, y): bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.0055, radius2=0.0055, depth=0.007, matrix=Matrix.Translation((x, y, 0.267)))
for i in range(15):
    x = CV_X0 + 0.02 + i * (cvl - 0.04) / 14
    for s in (1, -1): bolt(x, s * (CV_W / 2 + 0.009))
for j in range(9):
    y = -CV_W / 2 + 0.03 + j * (CV_W - 0.06) / 8
    bolt(CV_X1 + 0.009, y); bolt(CV_X0 - 0.009, y)
finish('Cover flange bolts', bm, M['steel_d'])
def strap(name, x, w=0.022, off=0.006, t=0.004):
    # flat steel clamp band hugging the rounded cover profile (YZ plane)
    hw, r = CV_W / 2, CV_R
    left = [(-hw, CV_B + 0.012, -1.0, 0.0)]
    for i in range(11):
        a = math.pi - (math.pi / 2) * i / 10      # 180 deg -> 90 deg around the top-left edge
        left.append((-hw + r + r * math.cos(a), CV_T - r + r * math.sin(a), math.cos(a), math.sin(a)))
    prof = left + [(-y, z, -ny, nz) for (y, z, ny, nz) in reversed(left)]
    bm2 = bmesh.new(); rows = []
    for y, z, ny, nz in prof:
        rows.append([bm2.verts.new((x + dx, y + ny * o, z + nz * o)) for dx in (-w / 2, w / 2) for o in (off, off + t)])
    for a, b in zip(rows[:-1], rows[1:]):
        if (a[0].co - b[0].co).length < 1e-6: continue
        bm2.faces.new((a[1], b[1], b[3], a[3])); bm2.faces.new((a[0], a[2], b[2], b[0]))
        bm2.faces.new((a[0], b[0], b[1], a[1])); bm2.faces.new((a[2], a[3], b[3], b[2]))
    bmesh.ops.remove_doubles(bm2, verts=bm2.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm2, faces=bm2.faces)
    finish(name, bm2, M['steel'], smooth=False)
for i, xs in enumerate((0.215, -0.39)): strap(f'Cover clamp strap {i}', xs)
# bulkhead glands where pipes leave the cover (front: suction hose into pump; rear: filtered-water return + cable)
cyl('Hose gland boot', 0.036, 0.03, (CV_X1 + 0.016, 0.13, 0.315), M['gasket'], axis='X', bevel=0.004)
flange('Hose bulkhead gland', 0.05, (CV_X1 + 0.004, 0.13, 0.315), 'X', bolts=8)
cyl('Return gland boot', 0.024, 0.026, (CV_X0 - 0.014, -0.15, 0.315), M['gasket'], axis='X', bevel=0.003)
flange('Return bulkhead gland', 0.036, (CV_X0 - 0.004, -0.15, 0.315), 'X', bolts=6)
cyl('Cable gland', 0.012, 0.02, (CV_X0 - 0.008, -0.26, 0.29), M['gasket'], axis='X', bevel=0.002)

LX, AZ = -0.10, 0.6075   # A-frame under the cover; lifting post through a sealed top plate; bell guide + eye on top
for s in (1, -1):
    pipe(f'A-frame leg {s}', [(LX, s * 0.27, 0.25), (LX, s * 0.02, CV_T - 0.012)], 0.012, M['steel'], smooth_path=False)
    box(f'A-frame foot {s}', (0.05, 0.04, 0.012), (LX, s * 0.27, 0.256), M['steel_d'], bevel=0.003)
box('A-frame head plate', (0.05, 0.07, 0.012), (LX, 0, CV_T - 0.012), M['steel_d'], bevel=0.003)
cyl('Lifting post', 0.016, 0.04, (LX, 0, CV_T), M['steel'])
cyl('Top seal plate', 0.075, 0.012, (LX, 0, CV_T + 0.006), M['steel'], bevel=0.003)
cyl('Top seal gasket', 0.078, 0.004, (LX, 0, CV_T + 0.001), M['gasket'])
bm = bmesh.new()
for k in range(8):
    a = 2 * math.pi * k / 8 + 0.2
    bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.005, radius2=0.005, depth=0.006, matrix=Matrix.Translation((LX + 0.06 * math.cos(a), 0.06 * math.sin(a), CV_T + 0.015)))
finish('Top seal plate bolts', bm, M['steel_d'])
cyl('Bell guide', 0.055, 0.045, (LX, 0, AZ + 0.012), M['steel'], r2=0.022, bevel=0.003)
cyl('Eye shank', 0.009, 0.03, (LX, 0, AZ + 0.045), M['steel'])
EYE = (LX, 0, AZ + 0.085)
torus('Eye bolt ring', 0.026, 0.008, EYE, M['steel'], rot=(math.pi / 2, 0, 0))

# ------------------------------------------------------------------ quick-release hook: silver body, red safety latch
def build_hook():
    R = 0.042; pts = [(-R, 0, 0.2), (-R, 0, R)]
    for i in range(1, 41):
        a = math.pi + i * (math.radians(222) / 40); pts.append((R * math.cos(a), 0, R + R * math.sin(a)))
    pipe('Hook body', pts, 0.013, M['steel'], c=HOOKC, parent=HOOK_ROOT, smooth_path=False)
    cyl('Hook tip', 0.013, 0.02, pts[-1], M['steel'], c=HOOKC, parent=HOOK_ROOT)
    p1 = Vector((-R + 0.012, 0, 0.15)); p2 = Vector(pts[-1]) + Vector((-0.004, 0, 0.012)); d = p2 - p1
    lat = box('Safety latch', (0.005, 0.018, d.length), ((p1 + p2) / 2), M['latch'], bevel=0.002, c=HOOKC, parent=HOOK_ROOT)
    lat.rotation_euler = (0, math.atan2(d.x, d.z), 0)
    box('Latch spring block', (0.03, 0.03, 0.035), (-R + 0.01, 0, 0.165), M['latch'], bevel=0.004, c=HOOKC, parent=HOOK_ROOT)
    cyl('Hook swivel', 0.022, 0.05, (-R, 0, 0.23), M['steel'], c=HOOKC, parent=HOOK_ROOT, bevel=0.004)
    cyl('Swivel nut', 0.026, 0.02, (-R, 0, 0.262), M['steel_d'], c=HOOKC, parent=HOOK_ROOT, bevel=0.003)
    torus('Swivel eye', 0.02, 0.007, (-R, 0, 0.295), M['steel'], rot=(math.pi / 2, 0, 0), c=HOOKC, parent=HOOK_ROOT)
    box('Release actuator', (0.03, 0.04, 0.045), (-R + 0.03, 0, 0.23), M['black'], bevel=0.004, c=HOOKC, parent=HOOK_ROOT)
    pipe('Winch cable', [(-R, 0, 0.31), (-R, 0, 4.0)], 0.0055, M['steel_d'], c=HOOKC, parent=HOOK_ROOT, smooth_path=False)
build_hook()

# ------------------------------------------------------------------ studio
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=12)
finish('Studio floor', bm, M['studio'], c=STAGE, parent=None, smooth=False)
def light(name, kind, loc, energy, size=1.0, target=(0, 0, 0.25), color='#FFFFFF', c=STAGE):
    ld = bpy.data.lights.new(name, kind); ld.energy = energy; ld.color = lin(color)
    if kind == 'AREA': ld.size = size
    ob = bpy.data.objects.new(name, ld); c.objects.link(ob); ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return ob
light('Key', 'AREA', (1.8, -1.6, 2.4), 480, 2.0)
light('Fill', 'AREA', (-2.2, -1.2, 1.4), 170, 2.5, color='#EAF2FF')
light('Rim', 'AREA', (-1.2, 2.2, 2.0), 360, 1.5)

# ------------------------------------------------------------------ hatch set (roof slab with 1 m × 1 m hatch, railing)
SLAB_Z = 1.25
slab = box('Roof slab', (4.0, 4.0, 0.25), (0, 0, SLAB_Z - 0.125), M['concrete'], bevel=0.0, c=HATCH, parent=None)
cut = box('Hatch opening 1x1', (1.0, 1.0, 0.6), (0, 0, SLAB_Z - 0.125), M['concrete'], bevel=0.0, c=HATCH, parent=None)
bo = slab.modifiers.new('hatch', 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = cut; cut.hide_render = True; cut.hide_viewport = True
for s in (1, -1):
    box(f'Hatch curb x{s}', (1.16, 0.08, 0.1), (0, s * 0.54, SLAB_Z + 0.05), M['concrete'], bevel=0.004, c=HATCH, parent=None)
    box(f'Hatch curb y{s}', (0.08, 1.16, 0.1), (s * 0.54, 0, SLAB_Z + 0.05), M['concrete'], bevel=0.004, c=HATCH, parent=None)
lid = box('Hatch lid', (1.1, 1.1, 0.03), (-0.0, 0.0, SLAB_Z + 0.1), M['steel_d'], bevel=0.004, c=HATCH, parent=None)
lid.location = (0, 0.6, SLAB_Z + 0.6); lid.rotation_euler = (math.radians(80), 0, 0)
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=2.0)   # dark water seen down through the hatch
finish('Water below hatch', bm, noisy('Water below', '#0F2A31', '#1C4A53', scale=2.5, rough=0.15, bump=0.05), c=HATCH, parent=None, loc=(0, 0, -0.2), smooth=False)
for s in (1, -1):   # winch gantry legs
    pipe(f'Gantry leg a{s}', [(s * 0.95, 0.75, SLAB_Z), (s * 0.95, 0.0, SLAB_Z + 2.0)], 0.04, M['steel'], c=HATCH, parent=None, smooth_path=False)
    pipe(f'Gantry leg b{s}', [(s * 0.95, -0.75, SLAB_Z), (s * 0.95, 0.0, SLAB_Z + 2.0)], 0.04, M['steel'], c=HATCH, parent=None, smooth_path=False)
pipe('Gantry beam', [(1.0, 0, SLAB_Z + 2.0), (-1.0, 0, SLAB_Z + 2.0)], 0.05, M['steel'], c=HATCH, parent=None, smooth_path=False)
cyl('Winch drum', 0.13, 0.36, (-0.1, 0, SLAB_Z + 1.86), M['latch'], axis='X', bevel=0.01, c=HATCH, parent=None)
for s in (1, -1):
    cyl(f'Winch end {s}', 0.16, 0.04, (-0.1 + s * 0.2, 0, SLAB_Z + 1.86), M['latch'], axis='X', bevel=0.006, c=HATCH, parent=None)

# ------------------------------------------------------------------ underwater reservoir context
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=16)
finish('Reservoir floor', bm, M['res_floor'], c=CTX, parent=None, smooth=False)
for px in (-3.2, 0.3, 3.8, 7.3):
    for py in (-2.6, 2.6, 7.8):
        box(f'Pillar {px} {py}', (0.5, 0.5, 6.0), (px, py, 3.0), M['pillar'], bevel=0.01, c=CTX, parent=None)
box('Back wall', (0.4, 20, 6.0), (-7.5, 0, 3.0), M['pillar'], bevel=0.0, c=CTX, parent=None)
wv = bpy.data.materials.new('Water volume'); wv.use_nodes = True; nt = wv.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF'])
pv = nt.nodes.new('ShaderNodeVolumePrincipled'); pv.inputs['Color'].default_value = (*lin('#5DB6C4'), 1)
pv.inputs['Density'].default_value = 0.09; pv.inputs['Absorption Color'].default_value = (*lin('#2B8EA0'), 1); pv.inputs['Anisotropy'].default_value = 0.35
nt.links.new(pv.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
box('Water volume', (20, 20, 4.4), (0, 0, 2.2), wv, bevel=0.0, c=CTX, parent=None)
for i, (lx, ly) in enumerate(((0.8, -1.0), (-2.0, 1.5), (3.5, 2.0))):
    ld = bpy.data.lights.new(f'Shaft {i}', 'SPOT'); ld.energy = 5000 if i == 0 else 2500; ld.spot_size = math.radians(38); ld.color = lin('#DDF6FF'); ld.shadow_soft_size = 0.3
    ob = bpy.data.objects.new(f'Shaft {i}', ld); CTX.objects.link(ob); ob.location = (lx, ly, 6.0); ob.rotation_euler = (math.radians(6), math.radians(-4), 0)
ld = bpy.data.lights.new('Water fill', 'AREA'); ld.energy = 1100; ld.size = 10; ld.color = lin('#86CFDD')
ob = bpy.data.objects.new('Water fill', ld); CTX.objects.link(ob); ob.location = (0, 0, 4.3)
bm = bmesh.new()   # loose sediment patches on the uncleaned floor ahead
import random; random.seed(7)
for k in range(1400):
    x = 0.55 + random.random() * 3.5; y = (random.random() - 0.5) * 2.4; s = 0.004 + random.random() ** 3 * 0.018
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=s, matrix=Matrix.Translation((x, y, s * 0.2)) @ Matrix.Diagonal((1.5, 1.2, 0.45, 1)))
finish('Sediment', bm, M['sed'], c=CTX, parent=None)

world = bpy.data.worlds.new('World'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*lin('#EEF0F2'), 1); bg.inputs['Strength'].default_value = 0.7

# ------------------------------------------------------------------ render settings
scene.render.engine = 'CYCLES'
try:
    pr = bpy.context.preferences.addons['cycles'].preferences; pr.compute_device_type = 'METAL'; pr.get_devices()
    for d in pr.devices: d.use = True
    scene.cycles.device = 'GPU'
except Exception as e: print('GPU setup failed:', e)
scene.cycles.samples = SAMPLES; scene.cycles.use_denoising = True
scene.cycles.volume_bounces = 1; scene.cycles.volume_step_rate = 2.0
scene.render.resolution_x, scene.render.resolution_y = RES
scene.view_settings.view_transform = 'AgX'
for lk in ('AgX - Punchy', 'AgX - Medium High Contrast'):
    try: scene.view_settings.look = lk; break
    except Exception: pass
scene.render.image_settings.file_format = 'PNG'

def cam(name, loc, target, lens=50, rot=None):
    cd = bpy.data.cameras.new(name); cd.lens = lens
    ob = bpy.data.objects.new(name, cd); STAGE.objects.link(ob); ob.location = loc
    ob.rotation_euler = rot if rot else (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return ob

def show(c, on): c.hide_render = not on

V = {
    'hero':    dict(cam=('C_hero', (1.55, -1.35, 0.85), (0.0, 0, 0.24), 50)),
    'side':    dict(cam=('C_side', (0.0, -2.7, 0.32), (0.0, 0, 0.28), 70)),
    'rear':    dict(cam=('C_rear', (-1.5, 1.35, 0.95), (0.0, 0, 0.25), 50)),
    'top':     dict(cam=('C_top', (0.0, 0.0, 2.6), None, 50, (0, 0, 0))),
    'parts':   dict(cam=('C_parts', (1.12, -1.12, 1.42), (-0.03, 0, 0.27), 45)),
    'brush':   dict(cam=('C_brush', (0.95, -0.55, 0.07), (0.40, -0.02, 0.07), 45)),
    'hook':    dict(cam=('C_hook', (0.95, -1.45, 1.05), (-0.06, 0, 0.5), 50), hook='approach'),
    'cover':   dict(cam=('C_cover', (0.95, -0.85, 0.62), (0.1, 0, 0.3), 42)),
    'hatch':   dict(cam=('C_hatch', (0.45, -1.95, 2.95), (0, 0, 1.3), 35), hook='engaged', hatch=True, lift=1.0),
    'hatch_top': dict(cam=('C_hatch_top', (0, 0, 6.0), None, 50, (0, 0, 0)), ortho=2.5, plan=True, hook='engaged', hatch=True, lift=0.85),
    'context': dict(cam=('C_context', (1.75, -1.45, 0.42), (0.15, 0, 0.25), 30), ctx=True),
}

def place_hook(mode, lift=0.0):
    show(HOOKC, mode != 'off')
    HOOK_ROOT.rotation_euler = (0, 0, math.pi / 2)
    top = (EYE[2] + 0.026 - 0.004) * S + lift   # bowl bottom rests on the top of the eye ring
    HOOK_ROOT.location = (EYE[0] * S + DX, 0, top + (0.07 if mode == 'approach' else 0.0))

for v in VIEWS:
    d = V[v]; c = d['cam']
    scene.camera = cam(c[0], c[1], c[2], c[3], *(c[4:] if len(c) > 4 else ()))
    ctx = d.get('ctx', False); hat = d.get('hatch', False); lift = d.get('lift', 0.0)
    show(CTX, ctx); show(HATCH, hat)
    for n in ('Key', 'Fill', 'Rim'): bpy.data.objects[n].hide_render = ctx
    bpy.data.objects['Studio floor'].hide_render = ctx or hat
    bg.inputs['Strength'].default_value = 0.02 if ctx else 0.7
    if ctx: bg.inputs['Color'].default_value = (*lin('#0E3A44'), 1)
    else: bg.inputs['Color'].default_value = (*lin('#EEF0F2'), 1)
    ROOT.location = (DX, 0, lift); ROOT.scale = (S, S, S)
    scene.camera.data.type = 'ORTHO' if d.get('ortho') else 'PERSP'
    if d.get('ortho'): scene.camera.data.ortho_scale = d['ortho']
    for ob in HATCH.objects:
        if ob.name.startswith(('Gantry', 'Winch')): ob.hide_render = bool(d.get('plan'))
    place_hook(d.get('hook', 'off'), lift)
    scene.render.filepath = os.path.join(OUT, f'{v}.png')
    bpy.ops.render.render(write_still=True); print('RENDERED', v, flush=True)

ROOT.location = (DX, 0, 0); ROOT.scale = (S, S, S); place_hook('approach'); show(HATCH, False); show(CTX, False)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'robot_C1_v3.blend'))
print('SAVED')
