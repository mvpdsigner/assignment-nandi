"""
KAHRAMAA robot · 8 s sample shot (underwater, cleaning pass). Uses the approved model v3 (robot_C1_v3.blend).
The robot crawls across the reservoir floor with the brush spinning, the tracks/wheels turning and the headlights on.
Sediment vanishes under the suction head, leaving a clean strip behind it. The camera arcs slowly around the robot.

Run:  Blender -b robot_C1_v3.blend -P anim_sample.py -- [--test 1,96,192] [--samples 40] [--res 1920x1080]
      (without --test renders all frames to renders/sample_v1/frames/####.png)
"""
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'renders', 'sample_v1')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d): return argv[argv.index(n) + 1] if n in argv else d
TEST = [int(v) for v in arg('--test', '').split(',') if v]
SAMPLES = int(arg('--samples', '40'))
ENGINE = arg('--engine', 'CYCLES')
RES = [int(v) for v in arg('--res', '1920x1080').split('x')]

scene = bpy.context.scene; D = bpy.data
FPS, F0, F1 = 24, 1, 192                     # 8 s
scene.render.fps = FPS; scene.frame_start, scene.frame_end = F0, F1
ROOT = D.objects['ROBOT_ROOT']; S = ROOT.scale.x
def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)

# ------------------------------------------------------------------ scene state: underwater only
for name, on in (('Robot', True), ('ReservoirContext', True), ('HatchSet', False), ('Hook', False), ('Studio', True)):
    D.collections[name].hide_render = not on
for n in ('Key', 'Fill', 'Rim', 'Studio floor'): D.objects[n].hide_render = True
bg = scene.world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*lin('#0E3A44'), 1); bg.inputs['Strength'].default_value = 0.02

# ------------------------------------------------------------------ motion
X0, X1 = -0.55, 0.15                          # ROOT x over the shot (0.70 m)
DIST = X1 - X0
def travel(f): return DIST * (f - F0) / (F1 - F0)        # metres travelled at frame f (constant crawl speed)
bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'   # constant crawl speed + steady camera
ROOT.animation_data_clear()
ROOT.location = (X0, 0, 0); ROOT.keyframe_insert('location', frame=F0)
ROOT.location = (X1, 0, 0); ROOT.keyframe_insert('location', frame=F1)

# tracks: rebuild belt without grousers; grousers become their own mesh, re-laid every frame so the belt runs
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

SPIN = []   # (object, radius in model units)  -> rolls with the robot
for o in D.objects:
    if o.parent == ROOT and o.name.startswith(('Sprocket', 'Hub ')): SPIN.append((o, TR_R - TR_T))
    if o.parent == ROOT and o.name.startswith(('Road wheel', 'Road hub')): SPIN.append((o, 0.044))
BRUSH = [D.objects['Brush core'], D.objects['Brush bristles']]
BRUSH_RPS = 2.2

def pose(f):
    d = travel(f) / S                          # distance in model units
    lay_grousers(-d)                           # bottom run moves backwards relative to the hull = still on the floor
    for o, r in SPIN: o.rotation_euler = (0, d / r, 0)
    for o in BRUSH: o.rotation_euler = (0, 2 * math.pi * BRUSH_RPS * (f - F0) / FPS, 0)
def on_frame(sc, *_): pose(sc.frame_current)
bpy.app.handlers.frame_change_pre.clear(); bpy.app.handlers.frame_change_pre.append(on_frame)

# ------------------------------------------------------------------ sediment field + clean strip behind the head
old = D.objects['Sediment']; D.objects.remove(old, do_unlink=True)
sm = D.materials['Sediment'].copy(); sm.name = 'Floor sediment'
REF = D.objects.new('CLEAN_REF', None); D.collections['Robot'].objects.link(REF); REF.parent = ROOT; REF.location = (0.37, 0, 0)
nt = sm.node_tree; N = nt.nodes; L = nt.links; out = N['Material Output']; bsdf = N['Principled BSDF']
tc = N.new('ShaderNodeTexCoord'); tc.object = REF
sx = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sx.inputs[0])
behind = N.new('ShaderNodeMath'); behind.operation = 'LESS_THAN'; behind.inputs[1].default_value = 0.0; L.new(sx.outputs['X'], behind.inputs[0])
ay = N.new('ShaderNodeMath'); ay.operation = 'ABSOLUTE'; L.new(sx.outputs['Y'], ay.inputs[0])
inside = N.new('ShaderNodeMath'); inside.operation = 'LESS_THAN'; inside.inputs[1].default_value = 0.27; L.new(ay.outputs[0], inside.inputs[0])
mask = N.new('ShaderNodeMath'); mask.operation = 'MULTIPLY'; L.new(behind.outputs[0], mask.inputs[0]); L.new(inside.outputs[0], mask.inputs[1])
tr = N.new('ShaderNodeBsdfTransparent'); mix = N.new('ShaderNodeMixShader')
L.new(mask.outputs[0], mix.inputs[0]); L.new(bsdf.outputs[0], mix.inputs[1]); L.new(tr.outputs[0], mix.inputs[2])
L.new(mix.outputs[0], out.inputs['Surface'])
bm = bmesh.new(); random.seed(7)
for k in range(6500):
    x = -3.2 + random.random() * 8.0; y = (random.random() - 0.5) * 4.4; s = 0.004 + random.random() ** 3 * 0.018
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=s, matrix=Matrix.Translation((x, y, s * 0.2)) @ Matrix.Rotation(random.random() * 6.3, 4, 'Z') @ Matrix.Diagonal((1.5, 1.2, 0.45, 1)))
for k in range(17000):   # fine silt grains
    x = -3.2 + random.random() * 8.0; y = (random.random() - 0.5) * 4.4; s = 0.0025 + random.random() ** 2 * 0.005
    bmesh.ops.create_icosphere(bm, subdivisions=0, radius=s, matrix=Matrix.Translation((x, y, s * 0.15)) @ Matrix.Diagonal((1.4, 1.2, 0.4, 1)))
me = D.meshes.new('Sediment field'); bm.to_mesh(me); bm.free()
sed = D.objects.new('Sediment field', me); D.collections['ReservoirContext'].objects.link(sed); me.materials.append(sm)

# silt film over the floor: patchy brown layer, removed in the same clean strip
fm = D.materials.new('Silt film'); fm.use_nodes = True; ft = fm.node_tree; FN = ft.nodes; FL = ft.links
fb = FN['Principled BSDF']; fb.inputs['Roughness'].default_value = 1.0
ftc = FN.new('ShaderNodeTexCoord'); ftc.object = REF
fsx = FN.new('ShaderNodeSeparateXYZ'); FL.new(ftc.outputs['Object'], fsx.inputs[0])
fbh = FN.new('ShaderNodeMath'); fbh.operation = 'LESS_THAN'; fbh.inputs[1].default_value = 0.0; FL.new(fsx.outputs['X'], fbh.inputs[0])
fay = FN.new('ShaderNodeMath'); fay.operation = 'ABSOLUTE'; FL.new(fsx.outputs['Y'], fay.inputs[0])
fin = FN.new('ShaderNodeMath'); fin.operation = 'LESS_THAN'; fin.inputs[1].default_value = 0.27; FL.new(fay.outputs[0], fin.inputs[0])
fmk = FN.new('ShaderNodeMath'); fmk.operation = 'MULTIPLY'; FL.new(fbh.outputs[0], fmk.inputs[0]); FL.new(fin.outputs[0], fmk.inputs[1])
gtc = FN.new('ShaderNodeTexCoord')
nz = FN.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.5; nz.inputs['Detail'].default_value = 10; FL.new(gtc.outputs['Generated'], nz.inputs['Vector'])
cov = FN.new('ShaderNodeValToRGB'); cov.color_ramp.elements[0].position = 0.30; cov.color_ramp.elements[1].position = 0.62
cov.color_ramp.elements[0].color = (0, 0, 0, 1); cov.color_ramp.elements[1].color = (1, 1, 1, 1); FL.new(nz.outputs['Fac'], cov.inputs['Fac'])
col = FN.new('ShaderNodeValToRGB'); col.color_ramp.elements[0].color = (*lin('#5E4B36'), 1); col.color_ramp.elements[1].color = (*lin('#8A7356'), 1)
nz2 = FN.new('ShaderNodeTexNoise'); nz2.inputs['Scale'].default_value = 40; FL.new(gtc.outputs['Generated'], nz2.inputs['Vector'])
FL.new(nz2.outputs['Fac'], col.inputs['Fac']); FL.new(col.outputs['Color'], fb.inputs['Base Color'])
inv = FN.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0; FL.new(cov.outputs['Color'], inv.inputs[1])
mx = FN.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; mx.use_clamp = True; FL.new(inv.outputs[0], mx.inputs[0]); FL.new(fmk.outputs[0], mx.inputs[1])
op = FN.new('ShaderNodeMath'); op.operation = 'MULTIPLY'; op.inputs[1].default_value = 1.0; FL.new(mx.outputs[0], op.inputs[0])
ftr = FN.new('ShaderNodeBsdfTransparent'); fmx = FN.new('ShaderNodeMixShader')
FL.new(op.outputs[0], fmx.inputs[0]); FL.new(fb.outputs[0], fmx.inputs[1]); FL.new(ftr.outputs[0], fmx.inputs[2])
FL.new(fmx.outputs[0], FN['Material Output'].inputs['Surface'])
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1.0, matrix=Matrix.Translation((0.0, 0, 0.0015)) @ Matrix.Diagonal((8.0, 8.0, 1, 1)))
me = D.meshes.new('Silt film'); bm.to_mesh(me); bm.free()
film = D.objects.new('Silt film', me); D.collections['ReservoirContext'].objects.link(film); me.materials.append(fm)
sm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*lin('#5C4630'), 1)

# suspended specks in the water (parallax depth cue)
pm = D.materials.new('Water specks'); pm.use_nodes = True
pb = pm.node_tree.nodes['Principled BSDF']; pb.inputs['Base Color'].default_value = (*lin('#D8E8E4'), 1)
pb.inputs['Emission Color'].default_value = (*lin('#BFE6EA'), 1); pb.inputs['Emission Strength'].default_value = 0.25
bm = bmesh.new(); random.seed(11); placed = 0
CAMPATH = [Vector(p) for p in ((1.25, -1.35, 0.72), (0.45, -1.75, 0.72), (-0.95, -1.15, 0.92))]
while placed < 380:
    p = Vector((-1.8 + random.random() * 4.0, -2.4 + random.random() * 4.0, 0.05 + random.random() * 1.3))
    if min((p - c).length for c in CAMPATH) < 0.75: continue    # nothing right in front of the lens
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.001 + random.random() * 0.0015, matrix=Matrix.Translation(p)); placed += 1
me = D.meshes.new('Specks'); bm.to_mesh(me); bm.free()
sp = D.objects.new('Water specks', me); D.collections['ReservoirContext'].objects.link(sp); me.materials.append(pm)

# headlight beams
for s in (1, -1):
    ld = D.lights.new(f'Beam {s}', 'SPOT'); ld.energy = 25; ld.spot_size = math.radians(42); ld.spot_blend = 0.6
    ld.color = lin('#FFF4DE'); ld.shadow_soft_size = 0.01
    ob = D.objects.new(f'Beam {s}', ld); D.collections['Robot'].objects.link(ob); ob.parent = ROOT
    ob.location = (0.475, s * 0.2, 0.13); ob.rotation_euler = (0, math.radians(-80), 0)

# ------------------------------------------------------------------ camera: slow arc, framing follows the robot
camd = D.cameras.new('C_sample'); camd.lens = 30
cam = D.objects.new('C_sample', camd); D.collections['Studio'].objects.link(cam); scene.camera = cam
tgt = D.objects.new('CAM_TARGET', None); D.collections['Studio'].objects.link(tgt)
tgt.location = (X0 + 0.05, 0, 0.24); tgt.keyframe_insert('location', frame=F0)
tgt.location = (X1 + 0.10, 0, 0.22); tgt.keyframe_insert('location', frame=F1)
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
for f, p in ((F0, (1.25, -1.35, 0.72)), (96, (0.45, -1.75, 0.72)), (F1, (-0.95, -1.15, 0.92))):
    cam.location = p; cam.keyframe_insert('location', frame=f)

# ------------------------------------------------------------------ render
scene.render.engine = 'BLENDER_EEVEE' if ENGINE == 'EEVEE' else 'CYCLES'
try:   # Metal GPU (device prefs are per session, not stored in the .blend)
    pr = bpy.context.preferences.addons['cycles'].preferences; pr.compute_device_type = 'METAL'; pr.get_devices()
    for d in pr.devices: d.use = True
    scene.cycles.device = 'GPU'
except Exception as e: print('GPU setup failed:', e)
if ENGINE == 'EEVEE':
    ee = scene.eevee; ee.taa_render_samples = 64
    for k, v in (('use_raytracing', True), ('volumetric_tile_size', '4'), ('volumetric_samples', 96), ('use_shadows', True), ('volumetric_end', 30.0)):
        try: setattr(ee, k, v)
        except Exception as e: print('eevee opt', k, e)
    for m in D.materials:
        try: m.surface_render_method = 'DITHERED'
        except Exception: pass
scene.cycles.samples = SAMPLES; scene.cycles.use_denoising = True
scene.render.use_persistent_data = True
scene.cycles.max_bounces = 6; scene.cycles.transparent_max_bounces = 12
scene.render.resolution_x, scene.render.resolution_y = RES; scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)
if TEST:
    for f in TEST:
        scene.frame_set(f); pose(f)
        scene.render.filepath = os.path.join(OUT, f'test_{f:03d}.png')
        bpy.ops.render.render(write_still=True); print('TEST', f, flush=True)
else:
    scene.render.filepath = os.path.join(OUT, 'frames', '')
    bpy.ops.render.render(animation=True)
    print('DONE')
