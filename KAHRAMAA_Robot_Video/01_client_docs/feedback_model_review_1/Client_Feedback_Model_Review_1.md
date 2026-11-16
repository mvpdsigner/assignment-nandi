# Client feedback on Model Review 1 (received 2026-11-15, WhatsApp)

## Answers to the 4 review questions
1. **Component arrangement:** approved. Matches Concept C1; keep the current positioning.
2. **Look and colours:** approved. Keep the current design and colours.
3. **Lifting point:** the A-frame, bell guide and eye bolt arrangement is approved, with the central position, provided it supports safe and stable lifting. *"Just make sure it has enough space around it when entering from the hatch."*
4. **Anything missing:** add a **transparent waterproof protective cover** over the top components, like their mock-up (`client_cover_mockup_whatsapp.png`). It should:
   - have proper sealing around its edges and connections
   - protect the internals underwater
   - keep the components visible in the animation

## Extra WhatsApp comments
- On the underwater look-test page: "The only thing is to put a clear cover box on the top making sure it looks water proof." Their mock-up shows a rounded clear box with a steel rim, the eye bolt on top, and the sensor mast and hose outside the box.
- On the hatch page ("Passing the 1 m × 1 m hatch on the winch"): "Just make sure there is enough space and it shouldn't be touching the hatch." In v2 the robot was about 0.99 m long and visibly filled the opening.

## What we changed (model v3, `04_animation/blender/build_robot_v3.py`)
- **Sealed clear cover:**
  - Rounded clear polycarbonate cover over all deck components.
  - Bolted steel base flange with a black gasket, plus two steel clamp straps.
  - Sealed top plate where the lifting post passes through, with the bell guide and eye bolt on top.
  - Bulkhead glands where the suction hose enters (front) and where the filtered-water return and the cable leave (rear).
- **Sensor mast:** moved outside the cover (rear left), as in their mock-up.
- **Size:** the whole robot is scaled to the 900 × 650 mm spec envelope, now about 0.86 m × 0.58 m overall. It is centred under the winch hook.
- **Hatch clearance:** about 7 cm at each end and 20 cm at each side in the 1 m × 1 m hatch. A new plan view shows this.
