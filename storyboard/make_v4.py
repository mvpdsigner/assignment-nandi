# Builds storyboard_v4.html from storyboard_v3.html with the client's 8 Nov answers applied.
import pathlib, re
here = pathlib.Path(__file__).parent
s = (here / 'storyboard_v3.html').read_text()

def rep(a, b, n=1):
    global s
    c = s.count(a)
    assert c == n, (a[:70], c)
    s = s.replace(a, b)

def block(start, end, new):
    global s
    i = s.index(start); j = s.index(end, i) + len(end); s = s[:i] + new + s[j:]

def line_with(fragment, new):
    """Replace the whole line containing fragment."""
    global s
    lines = s.split('\n'); hits = [i for i, l in enumerate(lines) if fragment in l]
    assert len(hits) == 1, (fragment, len(hits))
    indent = lines[hits[0]][:len(lines[hits[0]]) - len(lines[hits[0]].lstrip())]
    lines[hits[0]] = indent + new; s = '\n'.join(lines)

# ---- version labels
rep('<title>Solar Video Storyboard v3</title>', '<title>Solar Video Storyboard v4</title>')
rep('Video storyboard · v3 · updated with your 7 Nov files', 'Video storyboard · v4 · final, with your 8 Nov answers')
rep('Storyboard v3 for approval · 7 Nov 2026', 'Storyboard v4 · final · 8 Nov 2026')
s = s.replace('Storyboard v3 for approval', 'Storyboard v4 · final')
rep('No values are invented. Missing figures show as amber placeholders until you send them.',
    'No values are invented. Humidity, pressure and wind use the placeholder readings you agreed to.')

# ---- 2: rounded coordinates
rep('<div style="font-size:42px;font-weight:700;margin-top:18px">25.2324° N, 51.5643° E</div>',
    '<div style="font-size:42px;font-weight:700;margin-top:18px">25.23° N, 51.56° E</div>')
rep('<li>Website screenshot: real coordinates 25.23244, 51.56429, accuracy 10.3 m</li>',
    '<li>Website screenshot (your real capture). Our own graphics show the coordinates rounded: 25.23° N, 51.56° E</li>')
line_with('show the coordinates in full, or rounded', '<ul><li>Coordinates are rounded to 25.23° N, 51.56° E, as agreed.</li></ul>')

# ---- 3/4: wireless link from ESP32-CAM to the LilyGo
rep('It shrinks and starts moving down the tracker towards the electronics enclosure, and the camera follows it into section 4.',
    'It shrinks and flies over a <b>wireless link</b> towards the electronics enclosure, and the camera follows it into section 4.')
rep('<path d="M896 250 C905 300 910 340 910 420 V560 C905 680 780 760 640 800" fill="none" stroke="#DDE8DF" stroke-width="8" stroke-dasharray="4 18" stroke-linecap="round"/>',
    '<path d="M880 270 C800 380 640 560 470 760" fill="none" stroke="#DDE8DF" stroke-width="8" stroke-dasharray="2 22" stroke-linecap="round"/>\n'
    '          <g fill="none" stroke="#F8F7F2" stroke-width="7" stroke-linecap="round"><path d="M840 250a46 46 0 0 0 10 52M808 236a80 80 0 0 0 16 92M776 222a114 114 0 0 0 22 132"/><path d="M500 690a46 46 0 0 1 52 10M486 656a80 80 0 0 1 92 16M472 622a114 114 0 0 1 132 22"/></g>')
rep('<div class="photo" style="left:820px;top:430px;width:200px;padding:7px 7px 7px;transform:rotate(-4deg)">',
    '<div class="lbl" style="left:700px;top:330px">Wireless link<small>ESP32-CAM → LilyGo</small></div>\n'
    '        <div class="photo" style="left:560px;top:440px;width:200px;padding:7px 7px 7px;transform:rotate(-4deg)">')
rep('<p>The photo slides down the tracker into the enclosure. A magnifier "x-ray" opens on the <b>LilyGo board</b>; the photo is pulled into it and the SIM chip lights up.</p>',
    '<p>Radio rings pulse from the camera and the photo flies <b>wirelessly</b> to the enclosure. A magnifier "x-ray" opens on the <b>LilyGo board</b> (ESP32 + SIM); the rings land on it, the photo is pulled in and the SIM chip lights up.</p>')
line_with('how does the image get from the ESP32-CAM to the LilyGo?',
    '<ul><li>As you confirmed, the camera sends the image to the LilyGo <b>wirelessly</b>. The LilyGo then sends it over the cellular network.</li>')
rep('<ul style="margin-top:8px"><li>LilyGo, ngrok and Flask are drawn as simple icons with their names, not official logos.</li></ul>',
    '<li>LilyGo, ngrok and Flask are drawn as simple icons with their names, not official logos.</li></ul>')

# ---- 5: orange = shadows
s = s.replace('Identify assessment regions', 'Detect shaded areas')
rep('>Assessment regions identified</div>', '>Shaded Areas Detected</div>')
rep('the green fades out while the <b>orange regions grow in</b> from the edges of the objects that cast them.',
    'the green fades out while the <b>orange shadows grow in</b> from the objects that cast them, labelled <b>"Shaded Areas Detected"</b>.')
line_with('is "Assessment regions identified" the right label', '<ul><li>Orange regions are the shadows, labelled "Shaded Areas Detected" as agreed.</li></ul>')

# ---- 6: placeholder readings for humidity, pressure, wind
T = ('<div style="background:#fff;border-radius:16px;padding:14px 16px;height:128px;font-size:21px;font-weight:600;white-space:nowrap">{}'
     '<div style="font-size:38px;font-weight:800;margin-top:10px">{} <span style="font-size:22px;font-weight:600;color:#5E6E64">{}</span></div></div>')
for label, word, val, unit in (('Humidity', 'to confirm', '21.4', '%'), ('Pressure', 'to confirm', '1014.8', 'hPa'), ('Wind', 'needed', '3.6', 'm/s')):
    rep(f'<div style="background:#FBF1DE;border:4px dashed #C9820A;border-radius:16px;padding:12px 14px;height:128px;font-size:22px;font-weight:600;color:#8A5A06">{label}<div style="font-size:26px;font-weight:700;margin-top:14px">{word}</div></div>',
        T.format(label, val, unit))
rep('Each tile <b>counts up to your real reading</b> (25.00 W/m², 50.47 °C, 27.41 / 30.48 °C). Amber tiles are values still to confirm.',
    'Each tile <b>counts up to its reading</b>: your real 25.00 W/m², 50.47 °C and 27.41 / 30.48 °C, plus placeholder humidity, pressure and wind.')
rep('<li>Blynk values: Live Data from your dashboard recording (06_sensors_blynk/blynk_values.json)</li>',
    '<li>Blynk values: Live Data from your dashboard recording, plus agreed placeholders (06_sensors_blynk/blynk_values.json)</li>')
line_with('your Live Data shows <b>Humidity 1014.80 %</b>',
    '<ul><li><b>Placeholder readings</b>, as agreed: humidity 21.4 %, pressure 1014.8 hPa, wind 3.6 m/s. The wind sensor stays in the animation.</li></ul>')
line_with('the recording has <b>no wind speed</b>', '')

# ---- 7: rounded location, real report figures, no closing line
rep('<div style="font-size:34px;font-weight:800">25.2324° N, 51.5643° E</div>', '<div style="font-size:34px;font-weight:800">25.23° N, 51.56° E</div>')
rep('<div class="a" style="left:30px;top:420px;right:30px;font-size:24px;font-weight:600;color:#5E6E64;line-height:1.35">Bars rise in three steps: capacity, then with shade, then with shade + dust. The drop between them shows the losses.</div>',
    '<div class="a" style="left:30px;top:415px;right:30px;font-size:26px;font-weight:600;color:#5E6E64;line-height:1.35">Bars rise in three steps: capacity, with shade, with shade + dust. Your pick is highlighted: <b style="color:#355C4D">LONGi X10 485 bifacial · 10,354 kWh / year</b></div>')
block('<div class="card" style="left:60px;top:730px;width:560px;height:250px;padding:24px 28px;color:#355C4D"><div style="font-size:26px;font-weight:600;color:#5E6E64">Recommended panel &amp; placement</div>',
      '</div></div>',
      '<div class="card" style="left:60px;top:730px;width:560px;height:250px;padding:24px 28px;color:#355C4D"><div style="font-size:26px;font-weight:600;color:#5E6E64">Recommended panel &amp; placement</div>'
      '<div style="font-size:30px;font-weight:800;margin-top:10px">LONGi Hi-MO X10 · 485 W bifacial</div>'
      '<div style="font-size:25px;color:#5E6E64;margin-top:8px;line-height:1.35">10 panels · 4.85 kWp<br>South-facing · 25° tilt · portrait</div></div>')
block('<div class="card" style="left:1260px;top:730px;width:600px;height:250px;padding:24px 28px;color:#355C4D"><div style="font-size:26px;font-weight:600;color:#5E6E64">Cost · payback · ROI</div>',
      '</div></div>',
      '<div class="card" style="left:1260px;top:730px;width:600px;height:250px;padding:24px 28px;color:#355C4D"><div style="font-size:26px;font-weight:600;color:#5E6E64">Cost · payback · ROI</div>'
      '<div style="display:flex;gap:30px;margin-top:16px">'
      '<div><div style="font-size:42px;font-weight:800">23,747</div><div style="font-size:22px;color:#5E6E64">QAR installed</div></div>'
      '<div><div style="font-size:42px;font-weight:800">15.1</div><div style="font-size:22px;color:#5E6E64">years payback</div></div>'
      '<div><div style="font-size:42px;font-weight:800">93 %</div><div style="font-size:22px;color:#5E6E64">ROI · 30 years</div></div></div></div>')
rep('<div class="tag"><b>7</b>Final assessment</div>\n      </div></div>\n      <p>The core bursts open',
    '<div class="a" style="left:60px;top:1000px;font-size:22px;font-weight:600;color:#5E6E64">Estimated results from your Python analysis</div>\n        <div class="tag"><b>7</b>Final assessment</div>\n      </div></div>\n      <p>The core bursts open')
rep('followed by the recommended panel and the cost, payback and ROI cards. Amber cards are still waiting for values.',
    'followed by the recommended panel and placement, then the cost, payback and ROI, with every figure counting up. A small line marks them as estimates.')
block('<div class="a" style="left:120px;right:120px;top:740px;text-align:center;color:#F8F7F2">', '</div>\n        </div>',
      '<div class="a" style="left:120px;right:120px;top:770px;text-align:center;color:#F8F7F2">\n'
      '          <div style="font-size:46px;font-weight:800;letter-spacing:-.5px">IoT-Based Residential Rooftop Solar Panel Placement Assessment</div>\n        </div>')
rep('linked by the route. A closing line appears; hold on the final frame.', 'linked by the route. The project title fades up; hold on the final frame.')
rep('<div class="trans"><b>Closing line:</b> "From rooftop to recommendation" is a suggestion. Send your own wording if you prefer.</div>',
    '<div class="trans"><b>Ending:</b> project title only, with no closing sentence, logo or names.</div>')
rep('<li>Shading result, coordinates, clean device render</li>', '<li>Report figures: 07_dashboard_report/report_values.json</li>\n      <li>Shading result, coordinates, clean device render</li>')
line_with('the chart covers annual energy and losses. Still missing', '<ul><li>Figures from your Python analysis, shown as <b>estimates</b> (not measured production).</li><li>Shading and dust losses are shown by the drop between the chart bars.</li></ul>')
line_with("send the chart's numbers (e.g. CSV)", '')

# ---- last page: decisions instead of questions
rep('<h2>What changed, assets &amp; open questions</h2><span class="time">Please reply with answers or files</span>',
    '<h2>Final content: what changed &amp; what we agreed</h2><span class="time">No open questions</span>')
block('<h3 style="font-size:12px;color:var(--dark);margin:0 0 5px">Changes in v3 (from your 7 Nov files)</h3>', '</ul>',
'''<h3 style="font-size:12px;color:var(--dark);margin:0 0 5px">Changes in v4 (from your 8 Nov answers)</h3>
      <ul style="margin:0 0 5mm;padding-left:15px;font-size:10.8px;line-height:1.5">
        <li>The image goes from the ESP32-CAM to the LilyGo over a <b>wireless link</b>, then cellular → ngrok → Flask → desktop.</li>
        <li>The orange regions are labelled <b>"Shaded Areas Detected"</b>.</li>
        <li>Blynk shows humidity, pressure and wind as <b>placeholder readings</b>. The wind sensor stays.</li>
        <li>Section 7 shows your <b>final report figures</b>, labelled as estimates.</li>
        <li>Coordinates are rounded to <b>25.23° N, 51.56° E</b>.</li>
        <li>No closing sentence: the video ends on the project title.</li>
      </ul>''')
block('<tr><td>Clean device render + labelled reference</td>', '<td>7</td></tr>\n      </table>',
'''<tr><td>Clean device render + labelled reference</td><td class="ok">Received</td><td>1, 3, 4, 6, 7</td></tr>
        <tr><td>"Get My Location" website screenshot</td><td class="ok">Received</td><td>2</td></tr>
        <tr><td>Rooftop photo + green + orange stages</td><td class="ok">Received</td><td>3, 4, 5, 7</td></tr>
        <tr><td>Live sensor readings (dashboard recording)</td><td class="ok">Received</td><td>6</td></tr>
        <tr><td>Humidity, pressure, wind</td><td class="ok">Placeholders agreed</td><td>6</td></tr>
        <tr><td>Annual energy chart by panel</td><td class="ok">Received</td><td>7</td></tr>
        <tr><td>Final report figures</td><td class="ok">Received</td><td>7</td></tr>
      </table>''')
block('<h3 style="font-size:12px;color:var(--dark);margin:0 0 5px">Questions</h3>', '</ol>',
'''<h3 style="font-size:12px;color:var(--dark);margin:0 0 5px">Final report figures (shown in section 7)</h3>
      <table>
        <tr><td>Recommended panel</td><td>LONGi Hi-MO X10 LR7-54HVD-485M (485 W, bifacial)</td></tr>
        <tr><td>Placement</td><td>South-facing, 25° tilt, portrait</td></tr>
        <tr><td>System</td><td>10 panels · 4.85 kWp</td></tr>
        <tr><td>Estimated annual energy</td><td>10,354 kWh</td></tr>
        <tr><td>Installation cost</td><td>23,747 QAR</td></tr>
        <tr><td>Payback period</td><td>15.1 years</td></tr>
        <tr><td>ROI</td><td>93 % over 30 years</td></tr>
      </table>
      <p style="font-size:10px;color:var(--muted);margin:4px 0 0">Estimates from your Python analysis, not measured annual production.</p>''')
rep('<b>Next step:</b> once v3 is approved, we send an animated preview of sections 3–5 (capture → transfer → shading) to confirm the new continuous motion style, then produce the full 75-second video.',
    '<b>Next step:</b> the content is final. We now produce the full 75-second video in the approved <b>Clean Flat</b> style.')

assert '25.2324' not in s and 'Assessment regions' not in s and 'From rooftop' not in s and 'to confirm<' not in s
(here / 'storyboard_v4.html').write_text(s)
print('ok')
