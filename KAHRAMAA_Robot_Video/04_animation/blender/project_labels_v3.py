"""Project named anchor points (robot-local model units) into v3 camera images for review-board callouts.
Run: Blender -b robot_C1_v3.blend -P project_labels_v3.py -- out.json
The robot root carries the v3 scale + centring offset, so anchors go through ROBOT_ROOT's world matrix.
"""
import bpy, json, sys
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

out = sys.argv[sys.argv.index('--') + 1]
scene = bpy.context.scene
W, H = 1920, 1080
root = bpy.data.objects['ROBOT_ROOT']; hook = bpy.data.objects['HOOK_ROOT']
bpy.context.view_layer.update()
R = lambda p: root.matrix_world @ Vector(p)
LX = -0.10
ANCHORS = {
    'parts': {
        'Suction hood': R((0.40, 0.0, 0.16)),
        'Suction hose': R((0.36, 0.05, 0.26)),
        'Vortex / slurry pump': R((0.215, 0.13, 0.36)),
        'Hydrocyclone': R((-0.02, 0.13, 0.46)),
        'Screw conveyor (proposed)': R((-0.17, 0.13, 0.30)),
        'Sealed debris cartridge': R((-0.35, 0.12, 0.42)),
        'Polishing filter': R((-0.28, -0.15, 0.37)),
        'Filtered-water return': R((-0.508, -0.15, 0.37)),
        'Battery pack': R((0.12, -0.15, 0.35)),
        'Guided docking eye (proposed)': R((LX, 0.0, 0.69)),
        'Sonar · depth · turbidity sensors': R((-0.505, -0.26, 0.44)),
        'Two continuous tracks': R((-0.05, -0.33, 0.12)),
        'Sealed clear cover': R((0.05, -0.317, 0.50)),
    },
    'cover': {
        'Clear polycarbonate cover': R((-0.05, -0.317, 0.47)),
        'Bolted flange + gasket': R((0.05, -0.33, 0.257)),
        'Clamp strap': R((0.215, -0.322, 0.40)),
        'Sealed top plate': R((LX, -0.05, 0.592)),
        'Hose bulkhead gland': R((0.29, 0.13, 0.315)),
        'Sensor mast (outside)': R((-0.505, -0.26, 0.44)),
    },
    'hook': {
        'Quick-release hook with safety latch': hook.matrix_world @ Vector((0, 0, 0.13)),
        'Eye bolt': R((LX, 0.0, 0.6925)),
        'Bell guide': R((LX, 0.0, 0.62)),
        'Sealed top plate': R((LX, 0.0, 0.592)),
    },
}
import os
res = json.load(open(out)) if os.path.exists(out) else {}   # merge: a partial re-render only has some cameras
for view, pts in ANCHORS.items():
    cam = bpy.data.objects.get('C_' + view)
    if cam is None: continue
    res[view] = {}
    for name, p in pts.items():
        co = world_to_camera_view(scene, cam, p)
        x, y = co.x * W, (1 - co.y) * H
        res[view][name] = [round(x, 1), round(y, 1), 0 <= x <= W and 0 <= y <= H and co.z > 0]
json.dump(res, open(out, 'w'), indent=1)
print(json.dumps(res))
