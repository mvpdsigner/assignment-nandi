"""
2D style options from the approved v3 model (EEVEE, fast):
  cel  : cel-shaded perspective frame, flat colour bands + ink outlines (inverted-hull), flat underwater background
  iso  : isometric flat-shaded infographic frame (orthographic), soft colour bands, thin outlines
Run: Blender -b robot_C1_v3.blend -P toon_styles.py -- [--views cel,iso] [--res 1920x1080]
"""
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'renders', 'styles_2d'); os.makedirs(OUT, exist_ok=True)
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d): return argv[argv.index(n) + 1] if n in argv else d
VIEWS = arg('--views', 'cel,iso').split(',')
RES = [int(v) for v in arg('--res', '1920x1080').split('x')]
scene = bpy.context.scene; D = bpy.data
ROOT = D.objects['ROBOT_ROOT']; S = ROOT.scale.x
def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)

FLAT = {   # material -> flat illustration colour
    'Aluminium hood': '#C3CBD2', 'Body light grey': '#C9CFD4', 'Body dark grey': '#4A5157', 'Housing maroon': '#7A1530',
    'Track rubber': '#25282C', 'Steel': '#CDD3D8', 'Steel dark': '#7A828A', 'Brush bristles': '#2266D0', 'Brush core': '#1A4A90',
    'Pump blue': '#2459B8', 'Motor black': '#2C3036', 'Filter pleats': '#F1F3F5', 'Blue flange': '#2A62C4', 'Cartridge grey': '#3B4248',
    'Corrugated hose': '#3C4147', 'Black plastic': '#202226', 'Latch red': '#C0202A', 'Sediment': '#8A5E36', 'Gasket rubber': '#15171A',
    'Reservoir floor': '#7FA7A6', 'Reservoir pillar': '#8DB5B6', 'Concrete': '#B9B6AE',
}
CLEAR = ('Clear acrylic', 'Clear polycarbonate cover')
INK = D.materials.new('Ink'); INK.use_nodes = True; INK.use_backface_culling = True
nt = INK.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF'])
e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*lin('#16181B'), 1)
nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs['Surface'])

def toon(m, hexcol, bands):
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
    L.new(em.outputs[0], out.inputs['Surface'])

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

# ------------------------------------------------------------------ scene: flat underwater set (no volume, no studio)
D.collections['HatchSet'].hide_render = True; D.collections['Hook'].hide_render = True
D.collections['ReservoirContext'].hide_render = False; D.collections['Robot'].hide_render = False; D.collections['Studio'].hide_render = False
for n in ('Key', 'Fill', 'Rim', 'Studio floor', 'Water volume', 'Water fill', 'Shaft 0', 'Shaft 1', 'Shaft 2'):
    if n in D.objects: D.objects[n].hide_render = True
ROOT.location = (0.02, 0, 0)
sun = D.lights.new('Toon sun', 'SUN'); sun.energy = 3.0; sun.angle = math.radians(2)
so = D.objects.new('Toon sun', sun); D.collections['Studio'].objects.link(so); so.rotation_euler = (math.radians(38), math.radians(-18), math.radians(-32))
w = scene.world; w.use_nodes = True; bg = w.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (*lin('#2E7E89'), 1); bg.inputs['Strength'].default_value = 1.0

for m in D.materials:
    if m.name in CLEAR: clear_toon(m, 0.10 if m.name.startswith('Clear poly') else 0.28)
    elif m.name == 'Lamp': lamp(m)
    elif m.name in FLAT: toon(m, FLAT[m.name], (0.62, 0.80, 1.0))
# flat sediment ahead + clean lane behind the head (same mask idea as the 3D sample)
sed = D.objects['Sediment']; sed.hide_render = False
bm = bmesh.new(); random.seed(5)
for k in range(1600):
    x = 0.5 + random.random() * 3.0; y = (random.random() - 0.5) * 3.0; s = 0.006 + random.random() ** 2 * 0.016
    bmesh.ops.create_circle(bm, cap_ends=True, segments=10, radius=s, matrix=Matrix.Translation((x, y, 0.002)) @ Matrix.Diagonal((1.4, 1, 1, 1)))
me = D.meshes.new('Flat sediment'); bm.to_mesh(me); bm.free()
fs = D.objects.new('Flat sediment', me); D.collections['ReservoirContext'].objects.link(fs); me.materials.append(D.materials['Sediment'])
sed.hide_render = True

scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 32
try: scene.eevee.use_shadows = True
except Exception: pass
scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'
scene.render.resolution_x, scene.render.resolution_y = RES
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'

def cam(name, loc, target, lens=50, ortho=None, rot=None):
    cd = D.cameras.new(name); cd.lens = lens
    if ortho: cd.type = 'ORTHO'; cd.ortho_scale = ortho
    ob = D.objects.new(name, cd); D.collections['Studio'].objects.link(ob); ob.location = loc
    ob.rotation_euler = rot if rot else (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return ob

if 'cel' in VIEWS:
    outline(0.009)
    scene.camera = cam('C_cel', (1.75, -1.45, 0.62), (0.12, 0, 0.27), 34)
    scene.render.filepath = os.path.join(OUT, 'style_cel.png'); bpy.ops.render.render(write_still=True); print('RENDERED cel', flush=True)
if 'iso' in VIEWS:
    for o in D.collections['Robot'].all_objects:
        if 'ink' in o.modifiers: o.modifiers['ink'].thickness = 0.0045
    if 'ink' not in [mm.name for o in D.collections['Robot'].all_objects for mm in o.modifiers]: outline(0.0045)
    for n, m in D.materials.items():
        if n in FLAT: toon(m, FLAT[n], (0.70, 0.86, 1.0))
    for p in [o for o in D.objects if o.name.startswith('Pillar')]: p.hide_render = True
    D.objects['Back wall'].hide_render = True
    bg.inputs['Color'].default_value = (*lin('#EAF3F4'), 1)
    D.objects['Reservoir floor'].hide_render = True
    bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=72, radius=0.86)
    me = D.meshes.new('Iso tile'); bm.to_mesh(me); bm.free()
    tile = D.objects.new('Iso tile', me); D.collections['ReservoirContext'].objects.link(tile); tile.location = (0.06, 0, -0.001)
    tm = D.materials.new('Iso tile'); toon(tm, '#9CC3C3', (0.75, 0.9, 1.0)); me.materials.append(tm)
    a = math.radians(54.7356)
    scene.camera = cam('C_iso', (2.4, -2.4, 2.4 * math.sqrt(2) / math.tan(a) * 0.5 + 0.3), None, ortho=1.75, rot=(a, 0, math.radians(45)))
    scene.camera.data.ortho_scale = 2.25
    scene.camera.location = Vector((0.0, 0, 0.22)) + Vector((1, -1, 1.2)).normalized() * 4
    scene.camera.rotation_euler = (Vector((0.0, 0, 0.22)) - scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = os.path.join(OUT, 'style_iso.png'); bpy.ops.render.render(write_still=True); print('RENDERED iso', flush=True)
