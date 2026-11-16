"""Project named 3D anchor points into a camera's image (for callout labels on the review board).
Run: Blender -b robot_C1_v1.blend -P project_labels.py -- out.json
"""
import bpy, json, sys
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

out = sys.argv[sys.argv.index('--') + 1]
scene = bpy.context.scene
W, H = 1920, 1080
bpy.data.objects['ROBOT_ROOT'].location = (0, 0, 0)
bpy.context.view_layer.update()

ANCHORS = {
    'parts': {
        'Suction hood': (0.40, 0.0, 0.16),
        'Soft rotating brush': (0.47, -0.2, 0.05),
        'Suction hose': (0.36, 0.05, 0.26),
        'Vortex / slurry pump': (0.215, 0.13, 0.36),
        'Hydrocyclone': (-0.02, 0.13, 0.46),
        'Screw conveyor (proposed)': (-0.17, 0.13, 0.30),
        'Sealed debris cartridge': (-0.35, 0.12, 0.42),
        'Polishing filter': (-0.28, -0.15, 0.37),
        'Filtered-water return': (-0.49, -0.15, 0.37),
        'Battery pack': (0.12, -0.15, 0.35),
        'Guided docking eye (proposed)': (-0.10, 0.0, 0.63),
        'Sonar · depth · turbidity sensors': (-0.40, -0.285, 0.46),
        'Two continuous tracks': (-0.05, -0.33, 0.12),
        'Front sonar + lights': (0.45, -0.2, 0.135),
    },
    'hook': {
        'Quick-release hook with safety latch': (-0.10, 0.0, 0.80),
        'Eye bolt': (-0.10, 0.0, 0.62),
        'Bell guide': (-0.10, 0.0, 0.55),
    },
}
res = {}
for view, pts in ANCHORS.items():
    cam = bpy.data.objects['C_' + view]
    res[view] = {}
    for name, p in pts.items():
        co = world_to_camera_view(scene, cam, Vector(p))
        res[view][name] = [round(co.x * W, 1), round((1 - co.y) * H, 1)]
json.dump(res, open(out, 'w'), indent=1)
print(json.dumps(res))
