# Asset index — Rooftop Solar Assessment video

Folders follow the 7 sections in the client's feedback (received 7 Nov 2026).
Client files are kept unaltered; only names were changed.

| Folder | File | Size | Used for |
|---|---|---|---|
| 01_device | device_render_clean.jpg | 1536×1024 | **Main device image** (received 7 Nov). It has no labels, so we animate our own. Used in S1, S3, S4, S6, S7 |
| 01_device | device_render_labelled.webp | 1536×1024 | Reference only: which part is which (BME280 and MLX90640 are on the enclosure front; ESP32 and RTC are inside) |
| 02_location | website_location.jpg | 1290×1361 | S2 website, "Get My Location" click, coordinates |
| 03_capture | rooftop_capture.jpg | 800×600 | S3 photo thumbnail after the camera flash; it is the same file that travels in S4 |
| 04_transmission | transmission_diagram_reference.jpg | 1774×887 | Reference only (route order and icons). The client wants motion, not this diagram on screen |
| 05_shading | stage1_original.jpg | 800×600 | S5 stage 1, original fisheye photo |
| 05_shading | stage2_roof_floor_green.jpg | 511×399 | S5 stage 2, roof floor in green ("Roof floor = 34% of image" title baked in) |
| 05_shading | stage3_assessment_orange.jpg | 1486×1113 | S5 stage 3, orange = shadows; on-screen label "Shaded Areas Detected" |
| 06_sensors_blynk | blynk_values.json | — | Readings for the Blynk screen in S6. Each is marked real or placeholder; humidity, pressure and wind are placeholders the client approved |
| 06_sensors_blynk | live_data_source.jpg | 800×480 | Where those values came from (Live Data tab of the dashboard recording) |
| 07_dashboard_report | dashboard_recording.mp4 | 800×480, 21.8 s | S7 final software dashboard and report |
| 07_dashboard_report | frame_*.jpg | 800×480 | Stills from the recording (overview, live data, shading, panels, report) |
| 07_dashboard_report | report_values.json | — | S7 final report figures from the client's Python analysis (estimates) |
| 07_dashboard_report | energy_by_panel_chart.jpg | 2000×645 | S7: annual kWh per panel model (capacity, with shade, with shade + dust) |
| _superseded/old_device_render | device_render_v1.jpg | 1672×941 | Earlier labelled render with a different layout. Replaced; kept so Storyboards v1–v2 still render |
| _superseded/old_rooftop_set | roof_original / roof_floor_mask / shading_after | small | Earlier set from a different rooftop. Not used; kept only so Storyboard v1 still renders |

Stages 1–3 in 05_shading show the same rooftop, so the shading section can morph one picture through each stage.

## Client decisions (8 Nov 2026)

Nothing is outstanding. All questions were answered:

- **Readings:** humidity, pressure and wind use realistic placeholders (in blynk_values.json). Keep the wind sensor in the animation.
- **Report:** the figures are in report_values.json. Label them as estimates.
- **"Pyrometer"** was a typo for pyranometer (solar irradiance). The MLX90640 is the thermal sensor.
- **Main board:** the LilyGo ESP32 with an integrated SIM handles cellular communication.
- **Image route:** the ESP32-CAM sends the image to the LilyGo **wirelessly**, then cellular → ngrok → Flask → desktop.
- **Orange regions** are shadows. Label them "Shaded Areas Detected".
- **Coordinates:** show them rounded, as 25.23° N, 51.56° E.
- **Closing:** no closing sentence, and no logo or team names.
- **Style:** A (Clean Flat) is approved.

The WhatsApp video sent on 7 Nov is identical to dashboard_recording.mp4, so it is not stored again.
