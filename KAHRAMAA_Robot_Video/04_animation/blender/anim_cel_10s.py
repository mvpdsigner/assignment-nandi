"""
KAHRAMAA robot · 10 s cel-shaded test (style C, the client's single-style pick, 16 Nov 2026).
The cleaning pass from anim_sample.py (tracks run, brush spins, sediment disappears behind the suction head)
drawn in the approved cel look from toon_styles.py (flat colour bands + ink outlines, flat underwater set).

Run (Blender):  blender -b robot_C1_v3.blend -P anim_cel_10s.py -- [--test 1,120,240] [--res 1920x1080]
Run (bpy module): python anim_cel_10s.py -- --blend robot_C1_v3.blend [--test ...] [--res ...]
Without --test, all 240 frames go to renders/cel_test_v1/frames/####.png (24 fps).
"""
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'renders', 'cel_test_v1')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d): return argv[argv.index(n) + 1] if n in argv else d
if '--blend' in argv: bpy.ops.wm.open_mainfile(filepath=os.path.abspath(arg('--blend', '')))
TEST = [int(v) for v in arg('--test', '').split(',') if v]
RES = [int(v) for v in arg('--res', '1920x1080').split('x')]
FIRST, LAST = int(arg('--first', '1')), int(arg('--last', '240'))

scene = bpy.context.scene; D = bpy.data
FPS, F0, F1 = 24, 1, 240                     # 10 s
scene.render.fps = FPS; scene.frame_start, scene.frame_end = F0, F1
ROOT = D.objects['ROBOT_ROOT']; S = ROOT.scale.x
def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)

# ------------------------------------------------------------------ set: flat underwater (as toon_styles.py, cel)
for name, on in (('Robot', True), ('ReservoirContext', True), ('HatchSet', False), ('Hook', False), ('Studio', True)):
    D.collections[name].hide_render = not on
for n in ('Key', 'Fill', 'Rim', 'Studio floor', 'Water volume', 'Water fill', 'Shaft 0', 'Shaft 1', 'Shaft 2'):
    if n in D.objects: D.objects[n].hide_render = True
sun = D.lights.new('Toon sun', 'SUN'); sun.energy = 3.0; sun.angle = math.radians(2)
so = D.objects.new('Toon sun', sun); D.collections['Studio'].objects.link(so)
so.rotation_euler = (math.radians(38), math.radians(-18), math.radians(-32))
w = scene.world; w.use_nodes = True; bg = w.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (*lin('#2E7E89'), 1); bg.inputs['Strength'].default_value = 1.0

# ------------------------------------------------------------------ motion (same crawl speed as the 8 s sample)
SPEED = 0.70 / (192 - 1)                      # metres per frame in the 8 s sample
X0 = -0.62; X1 = X0 + SPEED * (F1 - F0)       # about 0.87 m over 10 s
def travel(f): return (X1 - X0) * (f - F0) / (F1 - F0)
bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
ROOT.animation_data_clear()
ROOT.location = (X0, 0, 0); ROOT.keyframe_insert('location', frame=F0)
ROOT.location = (X1, 0, 0); ROOT.keyframe_insert('location', frame=F1)

TR_L, TR_R, TR_W, TR_T, TR_X, TR_Y = 0.74, 0.10, 0.12, 0.022, -0.07, 0.265
A = TR_L / 2 - TR_R; PER = 4 * A + 2 * math.pi * TR_R
def stad(s):
    s %= PER
    if s < 2 * A: return (-A + s, -TR_R, 0.0, -1.0)
    s -= 2 * A
    if s < math.pi * TR_R:
        t = -math.pi / 2 + s / TR_R; return (A + TR_R * math.cos(t), TR_R * math.sin(t), math.cos(t), math.sin(t))
    s -= math.pi * TR_R
    if s < 2 * A: return (A - s, TR_R, 0.0, 1.0)
    s -= 2 * A; t = math.pi / 2 + s / TR_R
    return (-A + TR_R * math.cos(t), TR_R * math.sin(t), math.cos(t), math.sin(t))
rubber = D.materials['Track rubber']
NG = 56
grousers = {}
for side in (1, -1):
    old = D.objects[f'Track {side}']; D.objects.remove(old, do_unlink=True)
    bm = bmesh.new(); ring = []; n = 160
    for i in range(n):
        x, z, nx, nz = stad(PER * i / n)
        ring.append((bm.verts.new((x, -TR_W / 2, z)), bm.verts.new((x, TR_W / 2, z)),
                     bm.verts.new((x - nx * TR_T, -TR_W / 2, z - nz * TR_T)), bm.verts.new((x - nx * TR_T, TR_W / 2, z - nz * TR_T))))
    for k in range(n):
        a, b = ring[k], ring[(k + 1) % n]
        bm.faces.new((a[0], b[0], b[1], a[1])); bm.faces.new((a[2], a[3], b[3], b[2]))
        bm.faces.new((a[0], a[2], b[2], b[0])); bm.faces.new((a[1], b[1], b[3], a[3]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = D.meshes.new(f'Belt {side}'); bm.to_mesh(me); bm.free()
    ob = D.objects.new(f'Track belt {side}', me); D.collections['Robot'].objects.link(ob); me.materials.append(rubber)
    ob.parent = ROOT; ob.location = (TR_X, side * TR_Y, TR_R)
    gm = D.meshes.new(f'Grousers {side}'); g = D.objects.new(f'Track grousers {side}', gm); D.collections['Robot'].objects.link(g)
    gm.materials.append(rubber); g.parent = ROOT; g.location = (TR_X, side * TR_Y, TR_R); grousers[side] = g

def lay_grousers(phase):
    for side, g in grousers.items():
        bm = bmesh.new()
        for k in range(NG):
            x, z, nx, nz = stad(k * PER / NG + phase)
            th = math.atan2(nx, nz)
            bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x + nx * 0.007, 0, z + nz * 0.007)) @ Matrix.Rotation(th, 4, 'Y') @ Matrix.Diagonal((0.016, TR_W * 1.02, 0.014, 1)))
        bm.to_mesh(g.data); bm.free(); g.data.update()

SPIN = []
for o in D.objects:
    if o.parent == ROOT and o.name.startswith(('Sprocket', 'Hub ')): SPIN.append((o, TR_R - TR_T))
    if o.parent == ROOT and o.name.startswith(('Road wheel', 'Road hub')): SPIN.append((o, 0.044))
BRUSH = [D.objects['Brush core'], D.objects['Brush bristles']]
BRUSH_RPS = 2.2

def pose(f):
    d = travel(f) / S
    lay_grousers(-d)
    for o, r in SPIN: o.rotation_euler = (0, d / r, 0)
    for o in BRUSH: o.rotation_euler = (0, 2 * math.pi * BRUSH_RPS * (f - F0) / FPS, 0)
def on_frame(sc, *_): pose(sc.frame_current)
bpy.app.handlers.frame_change_pre.clear(); bpy.app.handlers.frame_change_pre.append(on_frame)

# ------------------------------------------------------------------ cel materials (toon_styles.py, cel bands)
FLAT = {
    'Aluminium hood': '#C3CBD2', 'Body light grey': '#C9CFD4', 'Body dark grey': '#4A5157', 'Housing maroon': '#7A1530',
    'Track rubber': '#25282C', 'Steel': '#CDD3D8', 'Steel dark': '#7A828A', 'Brush bristles': '#2266D0', 'Brush core': '#1A4A90',
    'Pump blue': '#2459B8', 'Motor black': '#2C3036', 'Filter pleats': '#F1F3F5', 'Blue flange': '#2A62C4', 'Cartridge grey': '#3B4248',
    'Corrugated hose': '#3C4147', 'Black plastic': '#202226', 'Latch red': '#C0202A', 'Sediment': '#8A5E36', 'Gasket rubber': '#15171A',
    'Reservoir floor': '#7FA7A6', 'Reservoir pillar': '#8DB5B6', 'Concrete': '#B9B6AE',
}
BANDS = (0.62, 0.80, 1.0)
CLEAR = ('Clear acrylic', 'Clear polycarbonate cover')
INK = D.materials.new('Ink'); INK.use_nodes = True; INK.use_backface_culling = True
nt = INK.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF'])
e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*lin('#16181B'), 1)
nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs['Surface'])

def toon(m, hexcol, bands, mask_ref=None):
    """Cel bands from the sun. With mask_ref, the surface turns transparent in the cleaned lane behind the head."""
    m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    for n in list(N):
        if n.type != 'OUTPUT_MATERIAL': N.remove(n)
    out = N['Material Output']
    df = N.new('ShaderNodeBsdfDiffuse'); s2r = N.new('ShaderNodeShaderToRGB'); L.new(df.outputs[0], s2r.inputs[0])
    bw = N.new('ShaderNodeRGBToBW'); L.new(s2r.outputs['Color'], bw.inputs[0])
    cr = N.new('ShaderNodeValToRGB'); cr.color_ramp.interpolation = 'CONSTANT'; L.new(bw.outputs[0], cr.inputs['Fac'])
    els = cr.color_ramp.elements
    els[0].position = 0.0; els[0].color = (bands[0],) * 3 + (1,)
    els[1].position = 0.12; els[1].color = (bands[1],) * 3 + (1,)
    e3 = els.new(0.45); e3.color = (bands[2],) * 3 + (1,)
    mul = N.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1.0
    mul.inputs[6].default_value = (*lin(hexcol), 1); L.new(cr.outputs['Color'], mul.inputs[7])
    em = N.new('ShaderNodeEmission'); L.new(mul.outputs[2], em.inputs['Color'])
    if mask_ref is None:
        L.new(em.outputs[0], out.inputs['Surface']); return
    tc = N.new('ShaderNodeTexCoord'); tc.object = mask_ref
    sx = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sx.inputs[0])
    behind = N.new('ShaderNodeMath'); behind.operation = 'LESS_THAN'; behind.inputs[1].default_value = 0.0; L.new(sx.outputs['X'], behind.inputs[0])
    ay = N.new('ShaderNodeMath'); ay.operation = 'ABSOLUTE'; L.new(sx.outputs['Y'], ay.inputs[0])
    inside = N.new('ShaderNodeMath'); inside.operation = 'LESS_THAN'; inside.inputs[1].default_value = 0.27; L.new(ay.outputs[0], inside.inputs[0])
    mask = N.new('ShaderNodeMath'); mask.operation = 'MULTIPLY'; L.new(behind.outputs[0], mask.inputs[0]); L.new(inside.outputs[0], mask.inputs[1])
    tr = N.new('ShaderNodeBsdfTransparent'); mx = N.new('ShaderNodeMixShader')
    L.new(mask.outputs[0], mx.inputs[0]); L.new(em.outputs[0], mx.inputs[1]); L.new(tr.outputs[0], mx.inputs[2])
    L.new(mx.outputs[0], out.inputs['Surface'])
    try: m.surface_render_method = 'DITHERED'
    except Exception: pass

def clear_toon(m, strength):
    m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    for n in list(N):
        if n.type != 'OUTPUT_MATERIAL': N.remove(n)
    out = N['Material Output']
    lw = N.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.35
    rim = N.new('ShaderNodeMath'); rim.operation = 'GREATER_THAN'; rim.inputs[1].default_value = 0.55; L.new(lw.outputs['Facing'], rim.inputs[0])
    base = N.new('ShaderNodeMath'); base.operation = 'MULTIPLY_ADD'; base.inputs[1].default_value = 0.5; base.inputs[2].default_value = strength
    L.new(rim.outputs[0], base.inputs[0])
    tr = N.new('ShaderNodeBsdfTransparent'); em = N.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (*lin('#E8F7FB'), 1)
    mx = N.new('ShaderNodeMixShader'); L.new(base.outputs[0], mx.inputs[0]); L.new(tr.outputs[0], mx.inputs[1]); L.new(em.outputs[0], mx.inputs[2])
    L.new(mx.outputs[0], out.inputs['Surface'])
    try: m.surface_render_method = 'BLENDED'
    except Exception: pass

def lamp(m):
    m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL': nt.nodes.remove(n)
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (*lin('#FFF6D8'), 1); em.inputs['Strength'].default_value = 1.4
    nt.links.new(em.outputs[0], nt.nodes['Material Output'].inputs['Surface'])

def outline(width):
    for o in D.collections['Robot'].all_objects:
        if o.type not in ('MESH', 'CURVE') or o.name.startswith(('Clear cover', 'Brush bristles', 'Cyclone cone', 'Cyclone barrel', 'Conveyor tube', 'Filter canister', 'Cartridge window')): continue
        if 'ink' in o.modifiers: continue
        if INK.name not in [m.name for m in o.data.materials if m]: o.data.materials.append(INK)
        sm = o.modifiers.new('ink', 'SOLIDIFY'); sm.thickness = width; sm.offset = 1; sm.use_flip_normals = True; sm.use_rim = False
        sm.material_offset = len(o.data.materials) - 1

for m in list(D.materials):
    if m.name in CLEAR: clear_toon(m, 0.10 if m.name.startswith('Clear poly') else 0.28)
    elif m.name == 'Lamp': lamp(m)
    elif m.name in FLAT: toon(m, FLAT[m.name], BANDS)

# ------------------------------------------------------------------ flat sediment ahead, clean lane behind the head
if 'Sediment' in D.objects: D.objects.remove(D.objects['Sediment'], do_unlink=True)
REF = D.objects.new('CLEAN_REF', None); D.collections['Robot'].objects.link(REF); REF.parent = ROOT; REF.location = (0.37, 0, 0)
sed_m = D.materials.new('Cel sediment'); toon(sed_m, '#8A5E36', BANDS, mask_ref=REF)
film_m = D.materials.new('Cel silt film'); toon(film_m, '#97906E', BANDS, mask_ref=REF)
bm = bmesh.new(); random.seed(5)
for k in range(20000):       # flat sediment flecks over the whole pass
    x = -4.5 + random.random() * 11.0; y = (random.random() - 0.5) * 8.0; s = 0.005 + random.random() ** 2 * 0.013
    bmesh.ops.create_circle(bm, cap_ends=True, segments=10, radius=s, matrix=Matrix.Translation((x, y, 0.003)) @ Matrix.Rotation(random.random() * 6.3, 4, 'Z') @ Matrix.Diagonal((1.4, 1, 1, 1)))
me = D.meshes.new('Cel sediment'); bm.to_mesh(me); bm.free()
fs = D.objects.new('Cel sediment', me); D.collections['ReservoirContext'].objects.link(fs); me.materials.append(sed_m)
# even silt layer over the whole floor (flat muddy tint); the cleaned lane shows the clean floor colour through it
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1.0, matrix=Matrix.Translation((0.8, 0, 0.0015)) @ Matrix.Diagonal((7.0, 6.0, 1, 1)))
me = D.meshes.new('Cel silt film'); bm.to_mesh(me); bm.free()
ff = D.objects.new('Cel silt film', me); D.collections['ReservoirContext'].objects.link(ff); me.materials.append(film_m)

# a few floating specks for depth (flat, pale)
pm = D.materials.new('Cel specks'); pm.use_nodes = True; pn = pm.node_tree
pn.nodes.remove(pn.nodes['Principled BSDF']); pe = pn.nodes.new('ShaderNodeEmission'); pe.inputs['Color'].default_value = (*lin('#CDEBEE'), 1)
pn.links.new(pe.outputs[0], pn.nodes['Material Output'].inputs['Surface'])
CAMPATH = [Vector(p) for p in ((1.25, -1.35, 0.72), (0.55, -1.75, 0.72), (-0.95, -1.15, 0.92))]
bm = bmesh.new(); random.seed(11); placed = 0
while placed < 260:
    p = Vector((-1.8 + random.random() * 4.2, -2.4 + random.random() * 4.0, 0.05 + random.random() * 1.3))
    if min((p - c).length for c in CAMPATH) < 0.75: continue
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.0015 + random.random() * 0.002, matrix=Matrix.Translation(p)); placed += 1
me = D.meshes.new('Cel specks'); bm.to_mesh(me); bm.free()
sp = D.objects.new('Cel specks', me); D.collections['ReservoirContext'].objects.link(sp); me.materials.append(pm)

outline(0.009)

# ------------------------------------------------------------------ camera: the sample's slow arc, stretched to 10 s
camd = D.cameras.new('C_cel10'); camd.lens = 30
cam = D.objects.new('C_cel10', camd); D.collections['Studio'].objects.link(cam); scene.camera = cam
tgt = D.objects.new('CAM_TARGET', None); D.collections['Studio'].objects.link(tgt)
tgt.location = (X0 + 0.05, 0, 0.24); tgt.keyframe_insert('location', frame=F0)
tgt.location = (X1 + 0.10, 0, 0.22); tgt.keyframe_insert('location', frame=F1)
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
for f, p in ((F0, CAMPATH[0]), ((F0 + F1) // 2, CAMPATH[1]), (F1, CAMPATH[2])):
    cam.location = p; cam.keyframe_insert('location', frame=f)
for fc in (cam.animation_data.action.fcurves if hasattr(cam.animation_data.action, 'fcurves') else []):
    for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'          # soft start/stop on the camera only

# ------------------------------------------------------------------ render (EEVEE, as the approved cel frame)
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = int(arg('--samples', '24'))
try: scene.eevee.use_shadows = True
except Exception: pass
scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'
scene.render.resolution_x, scene.render.resolution_y = RES; scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)
if '--top' in argv:   # debug: orthographic top view to check the clean lane
    td = D.cameras.new('C_top'); td.type = 'ORTHO'; td.ortho_scale = 4.0
    tc_ = D.objects.new('C_top', td); D.collections['Studio'].objects.link(tc_); tc_.location = (0, 0, 5); scene.camera = tc_
if TEST:
    for f in TEST:
        scene.frame_set(f); pose(f)
        scene.render.filepath = os.path.join(OUT, f'test_{f:03d}.png')
        bpy.ops.render.render(write_still=True); print('TEST', f, flush=True)
else:
    for f in range(FIRST, LAST + 1):
        p = os.path.join(OUT, 'frames', f'{f:04d}.png')
        if os.path.exists(p): continue                       # resumable
        scene.frame_set(f); pose(f)
        scene.render.filepath = p
        bpy.ops.render.render(write_still=True); print('FRAME', f, flush=True)
    print('DONE', flush=True)
