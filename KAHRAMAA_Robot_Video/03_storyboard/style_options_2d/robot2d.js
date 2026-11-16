// 2D side view of the approved Concept C1 robot (model v3), drawn in model millimetres (x = front, z = up).
// robotSVG(theme) returns the robot group; scene builders place it in a 1920x1080 frame.
const K = 0.95, OX = 860, OY = 820;              // px per mm, ground origin in the frame
const P = (x, z) => [OX + x * K, OY - z * K];   // model mm -> frame px (for labels outside the robot group)

function robotSVG(t) {
  const L = t === 'line';
  const r = (x0, z0, x1, z1, c, rr = 0) => `<rect class="${c}" x="${x0}" y="${z0}" width="${x1 - x0}" height="${z1 - z0}" rx="${rr}"/>`;
  const c = (x, z, rad, cl) => `<circle class="${cl}" cx="${x}" cy="${z}" r="${rad}"/>`;
  const p = (d, cl) => `<path class="${cl}" d="${d}"/>`;
  const stad = (cx, cz, a, rad) => `M${cx - a},${cz - rad} H${cx + a} A${rad},${rad} 0 0 1 ${cx + a},${cz + rad} H${cx - a} A${rad},${rad} 0 0 1 ${cx - a},${cz - rad} Z`;
  let s = '';
  // hull + deck
  s += r(-400, 55, 260, 225, 'hull', 14);
  s += r(-482, 213, 302, 221, 'dk') + r(-480, 220, 300, 250, 'deck', 4);
  s += r(-467, 248, 292, 254, 'blk');
  // cover back fill
  const cov = `M-455,262 V530 Q-455,585 -400,585 H225 Q280,585 280,530 V262 Z`;
  s += p(cov, 'coverback');
  // far side: cartridge, conveyor, cyclone, motor + pump
  s += r(-430, 250, -270, 400, 'cart', 10) + r(-435, 398, -265, 418, 'dk', 4) + r(-357, 418, -343, 452, 'blk', 4);
  s += r(-270, 242, -30, 302, 'clear', 6);
  let hel = ''; for (let i = 0; i < 8; i++) { const x = -262 + i * 29; hel += `M${x},248 L${x + 14},296 `; }
  s += p(hel, 'flight');
  s += r(-276, 234, -264, 310, 'steel') + r(-36, 234, -24, 310, 'steel');
  s += r(-38, 261, -2, 283, 'steel', 3);
  s += p('M-35,280 L-5,280 L35,410 L-75,410 Z', 'clear');
  s += r(-75, 410, 35, 480, 'clear', 4) + r(-82, 404, 42, 416, 'steel', 3);
  s += r(-84, 478, 44, 492, 'flange', 3) + r(-37, 492, -3, 522, 'flange', 3);
  s += p('M-20,520 V548 Q-20,562 -36,562 H-62 Q-82,562 -86,542 L-112,346 Q-117,316 -140,316', 'pipe');   // overflow -> filter
  s += r(56, 269, 76, 361, 'steeld', 6) + r(75, 265, 185, 365, 'motor', 10);
  let fins = ''; for (let i = 0; i < 6; i++) fins += `M80,${276 + i * 16} H180 `;
  s += p(fins, 'fin');
  s += r(105, 365, 155, 395, 'motor', 5);
  s += r(60, 250, 260, 270, 'pump', 4);
  s += p('M215,436 V452 Q215,470 197,470 H34', 'pipe');                                            // pump -> cyclone
  s += r(193, 379, 237, 430, 'pump', 4) + r(183, 427, 247, 439, 'steel', 3);
  s += r(190, 251, 240, 379, 'pump', 22) + r(237, 257, 257, 373, 'pump', 10) + r(256, 275, 268, 355, 'steel', 3);
  // near side: filter, battery, electronics
  s += r(-370 - 15, 237, -370 + 15, 287, 'dk', 3) + r(-190 - 15, 237, -190 + 15, 287, 'dk', 3);
  s += r(-410, 257, -150, 373, 'clear', 12);
  let pl = ''; for (let i = 0; i < 22; i++) pl += `M${-392 + i * 10.5},276 V354 `;
  s += r(-395, 273, -165, 357, 'pleatbg', 6) + p(pl, 'pleat');
  s += r(-430, 249, -410, 381, 'steel', 4) + r(-150, 249, -130, 381, 'steel', 4);
  s += r(-444, 255, -432, 375, 'flange', 3) + r(-128, 255, -116, 375, 'flange', 3);
  s += r(-75, 250, -5, 320, 'dk', 8);
  s += r(10, 250, 230, 340, 'batt', 12) + r(15, 338, 225, 350, 'dk', 4);
  // A-frame post + cover front, straps, flange, bolts
  s += r(-112, 250, -88, 573, 'steel', 4) + r(-125, 565, -75, 579, 'steeld', 3);
  s += p(cov, 'cover');
  if (!L) s += p('M-430,300 V520 Q-430,560 -392,560 H-200', 'shine');
  s += r(204, 262, 226, 591, 'steel', 4) + r(-401, 262, -379, 591, 'steel', 4);
  s += r(-481, 250, 307, 264, 'steel', 3);
  let b = ''; for (let i = 0; i < 16; i++) b += c(-468 + i * 50.5, 270, 5, 'bolt');
  s += b;
  s += r(-175, 585, -25, 597, 'steel', 3);
  s += p('M-155,597 L-45,597 L-78,642 L-122,642 Z', 'steel');
  s += r(-109, 642, -91, 672, 'steel', 3);
  s += `<circle class="ring" cx="-100" cy="692" r="26"/>`;
  // return pipe + outlet, sensor mast
  s += p('M-430,316 H-470 Q-505,316 -506,350', 'pipe');
  s += p('M-524,385 L-490,385 L-497,345 L-517,345 Z', 'steel');
  s += r(-515, 215, -455, 235, 'steeld', 3) + r(-516, 215, -494, 500, 'steeld', 5);
  s += r(-533, 365, -477, 435, 'blk', 8) + r(-527, 462, -483, 487, 'blk', 6) + c(-505, 494, 8, 'lamp');
  // tracks + wheels + guard
  s += p(stad(-70, 100, 270, 100), 'track');
  if (L) s += p(stad(-70, 100, 270, 106), 'grouserL'); else s += p(stad(-70, 100, 270, 104), 'grouser');
  s += p(stad(-70, 100, 270, 78), 'trackin');
  for (const x of [-340, 200]) s += c(x, 100, 70, 'wheel') + c(x, 100, 30, 'hub');
  for (const x of [-205, -70, 65]) s += c(x, 66, 42, 'wheel') + c(x, 66, 16, 'hub');
  s += r(-380, 140, 240, 210, 'guard', 6);
  // cleaning head: arms, brush, hood, lights, hose + gland
  s += p('M280,232 L332,198 L362,150', 'arm');
  s += c(390, 62, 60, 'brush') + c(390, 62, 30, 'brushcore');
  if (!L) { let br = ''; for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; br += `M${390 + Math.cos(a) * 34},${62 + Math.sin(a) * 34} L${390 + Math.cos(a) * 60},${62 + Math.sin(a) * 60} `; } s += p(br, 'bristle'); }
  s += p('M390,70 L476,88 A88,88 0 1 1 312,29 Z', 'hood');
  s += r(470, 80, 484, 96, 'blk', 2);
  s += r(362, 158, 418, 190, 'hood', 4) + r(340, 188, 440, 200, 'steel', 3);
  s += r(440, 112, 460, 148, 'blk', 4) + r(460, 118, 466, 142, 'lamp', 2);
  s += r(412, 139, 438, 171, 'blk', 4);
  s += p('M390,198 C392,262 344,330 292,318', 'hose');
  if (!L) s += p('M390,198 C392,262 344,330 292,318', 'hoserib');
  s += r(278, 265, 292, 365, 'steel', 3) + r(290, 279, 304, 351, 'blk', 4);
  return `<g transform="translate(${OX},${OY}) scale(${K},${-K})">${s}</g>`;
}

const CSS_FLAT = `
.flat .hull{fill:#3F474E}.flat .dk{fill:#4A535A}.flat .deck{fill:#C9CFD4}.flat .blk{fill:#1E2125}
.flat .coverback{fill:#DDF2F6;fill-opacity:.22}.flat .cover{fill:#E9F8FB;fill-opacity:.12;stroke:#F4FCFE;stroke-opacity:.9;stroke-width:5}
.flat .shine{fill:none;stroke:#fff;stroke-opacity:.55;stroke-width:9;stroke-linecap:round}
.flat .cart{fill:#3A4248}.flat .clear{fill:#E3F4F8;fill-opacity:.45;stroke:#F2FBFD;stroke-width:3}.flat .flight{fill:none;stroke:#AEB8BF;stroke-width:6}
.flat .steel{fill:#CDD4DA}.flat .steeld{fill:#7C858D}.flat .flange{fill:#2A62C4}.flat .pipe{fill:none;stroke:#C2CAD1;stroke-width:28;stroke-linecap:round}
.flat .motor{fill:#2B3036}.flat .fin{fill:none;stroke:#454C54;stroke-width:5}.flat .pump{fill:#2459B8}
.flat .pleatbg{fill:#F1F3F5}.flat .pleat{fill:none;stroke:#C9D0D6;stroke-width:3}.flat .batt{fill:#7A1530}
.flat .bolt{fill:#6C757D}.flat .ring{fill:none;stroke:#CDD4DA;stroke-width:15}.flat .lamp{fill:#FFF3C4}
.flat .track{fill:#24272B}.flat .grouser{fill:none;stroke:#24272B;stroke-width:20;stroke-dasharray:14 16}.flat .trackin{fill:#33383E}
.flat .wheel{fill:#59616A}.flat .hub{fill:#C9D0D6}.flat .guard{fill:#7A1530}
.flat .arm{fill:none;stroke:#7C858D;stroke-width:20;stroke-linecap:round;stroke-linejoin:round}
.flat .brush{fill:#2266D0}.flat .brushcore{fill:#163F80}.flat .bristle{fill:none;stroke:#4F8CEB;stroke-width:3}
.flat .hood{fill:#C3CBD2}.flat .hose{fill:none;stroke:#353A40;stroke-width:52;stroke-linecap:round}
.flat .hoserib{fill:none;stroke:#4C535A;stroke-width:54;stroke-dasharray:7 9}`;
const CSS_LINE = `
.line *{vector-effect:non-scaling-stroke}
.line .hull,.line .dk,.line .deck,.line .cart,.line .steel,.line .steeld,.line .motor,.line .pump,.line .batt,.line .guard,.line .hood,.line .wheel,.line .hub,.line .trackin,.line .pleatbg,.line .flange,.line .blk{fill:#fff;stroke:#1D1F23;stroke-width:1.6}
.line .hull,.line .dk,.line .blk,.line .motor{fill:#E9E9EA}.line .batt,.line .guard{fill:#F3E6EA;stroke:#530018}
.line .pump,.line .flange{fill:#E6EEFA;stroke:#1F4FA3}.line .track{fill:#E2E3E4;stroke:#1D1F23;stroke-width:1.6}
.line .grouserL{fill:none;stroke:#1D1F23;stroke-width:9;stroke-dasharray:2 12}
.line .coverback{fill:none}.line .cover{fill:none;stroke:#2A8AA0;stroke-width:2.2;stroke-dasharray:10 6}
.line .clear{fill:#fff;fill-opacity:.6;stroke:#1D1F23;stroke-width:1.4}.line .flight{fill:none;stroke:#8A8285;stroke-width:1.2}
.line .pipe{fill:none;stroke:#1D1F23;stroke-width:1.4}.line .fin{fill:none;stroke:#8A8285;stroke-width:1}
.line .pleat{fill:none;stroke:#B9B4B6;stroke-width:1}.line .bolt{fill:#1D1F23}.line .ring{fill:none;stroke:#1D1F23;stroke-width:2}
.line .lamp{fill:#FFE9A8;stroke:#1D1F23;stroke-width:1}.line .arm{fill:none;stroke:#1D1F23;stroke-width:1.6}
.line .brush{fill:#E6EEFA;stroke:#1F4FA3;stroke-width:1.6;stroke-dasharray:3 3}.line .brushcore{fill:#fff;stroke:#1F4FA3;stroke-width:1.4}
.line .hose{fill:none;stroke:#1D1F23;stroke-width:1.6}`;

function frameFlat() {
  let bg = `<defs><linearGradient id="fw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F8C97"/><stop offset=".55" stop-color="#1F6872"/><stop offset="1" stop-color="#174F58"/></linearGradient>
  <linearGradient id="ff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E9396"/><stop offset="1" stop-color="#8DB6B4"/></linearGradient>
  <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <rect width="1920" height="1080" fill="url(#fw)"/>`;
  for (const [x, w, o] of [[120, 120, .35], [520, 90, .25], [1240, 110, .3], [1660, 140, .4], [980, 70, .18]]) bg += `<rect x="${x}" y="80" width="${w}" height="590" fill="#9CC9CB" opacity="${o}"/>`;
  bg += `<polygon points="0,640 1920,600 1920,1080 0,1080" fill="url(#ff)"/>`;
  for (const [x, w] of [[300, 160], [820, 220], [1420, 180]]) bg += `<polygon points="${x},0 ${x + w},0 ${x + w * 2.2},1080 ${x + w * 0.6},1080" fill="url(#ray)"/>`;
  let sed = ''; let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 320; i++) { const x = 1330 + rnd() * 620, y = 650 + rnd() * 430, rx = 4 + rnd() ** 2 * 16; sed += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.42}" fill="${rnd() > .5 ? '#7A5230' : '#8C6440'}"/>`; }
  for (let i = 0; i < 70; i++) { const x = rnd() * 1900, y = 640 + rnd() * 440, rx = 3 + rnd() * 6; if (x > 1300) continue; sed += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.4}" fill="#7A5230" opacity=".35"/>`; }
  let sp = ''; for (let i = 0; i < 70; i++) sp += `<circle cx="${rnd() * 1920}" cy="${rnd() * 640}" r="${1 + rnd() * 2.4}" fill="#E6F7F7" opacity="${.3 + rnd() * .4}"/>`;
  const shadow = `<ellipse cx="${OX - 20}" cy="${OY + 6}" rx="560" ry="26" fill="#0E3A44" opacity=".35"/>`;
  return `<svg class="flat" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><style>${CSS_FLAT}</style>${bg}${sed}${shadow}${robotSVG('flat')}${sp}</svg>`;
}

function frameLine() {
  let g = `<rect width="1920" height="1080" fill="#F7F6F3"/>`;
  let grid = ''; for (let x = 0; x <= 1920; x += 40) grid += `M${x},0 V1080 `; for (let y = 0; y <= 1080; y += 40) grid += `M0,${y} H1920 `;
  g += `<path d="${grid}" stroke="#E7E3E0" stroke-width="1"/>`;
  g += `<line x1="60" y1="${OY + 1}" x2="1860" y2="${OY + 1}" stroke="#1D1F23" stroke-width="2"/>`;
  let hatch = ''; for (let x = 60; x < 1860; x += 18) hatch += `M${x},${OY + 2} l-12,14 `; g += `<path d="${hatch}" stroke="#8A8285" stroke-width="1"/>`;
  // flows drawn in frame px via P()
  const pts = a => a.map(([x, z]) => P(x, z).join(',')).join(' ');
  const slurry = [[470, 40], [400, 110], [390, 200], [388, 255], [350, 315], [292, 318], [262, 315], [215, 330], [215, 455], [200, 470], [34, 470], [-20, 455], [-20, 290], [-30, 272], [-270, 272], [-350, 290]];
  const clean = [[-20, 530], [-20, 560], [-84, 556], [-112, 346], [-140, 316], [-410, 316], [-470, 316], [-506, 350], [-507, 395], [-540, 470]];
  g += `<defs><marker id="ab" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#8A5A2B"/></marker>
  <marker id="aw" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1F7FC4"/></marker></defs>`;
  const flows = `<polyline points="${pts(slurry)}" fill="none" stroke="#8A5A2B" stroke-opacity=".85" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" marker-end="url(#ab)"/>
  <polyline points="${pts(clean)}" fill="none" stroke="#1F7FC4" stroke-opacity=".85" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" marker-end="url(#aw)"/>`;
  const items = [[420, 105, 'Brush + suction hood'], [222, 330, 'Vortex pump'], [-20, 445, 'Hydrocyclone'], [-205, 272, 'Screw conveyor (proposed)'],
    [-350, 375, 'Sealed debris cartridge'], [-285, 330, 'Polishing filter'], [-507, 395, 'Back to the reservoir']];
  let labels = '';
  items.forEach(([x, z, txt], i) => { const [px, py] = P(x, z); const col = i === 6 ? '#1F7FC4' : '#530018';
    labels += `<circle cx="${px}" cy="${py}" r="17" fill="#fff" stroke="${col}" stroke-width="2.5"/><text x="${px}" y="${py + 6}" text-anchor="middle" font-family="Inter,Arial" font-size="17" font-weight="800" fill="${col}">${i + 1}</text>`; });
  labels += `<g font-family="Inter,Arial"><rect x="60" y="858" width="900" height="168" rx="10" fill="#fff" stroke="#DBDADA"/>
    <text x="84" y="892" font-size="15" font-weight="800" fill="#8E0D31" letter-spacing="2">ONBOARD FLOW PATH</text>`;
  items.forEach(([, , txt], i) => { const col = i === 6 ? '#1F7FC4' : '#530018'; const x = 96 + Math.floor(i / 4) * 440, y = 928 + (i % 4) * 30;
    labels += `<circle cx="${x}" cy="${y - 6}" r="12" fill="#fff" stroke="${col}" stroke-width="2"/><text x="${x}" y="${y - 1}" text-anchor="middle" font-size="13" font-weight="800" fill="${col}">${i + 1}</text><text x="${x + 24}" y="${y}" font-size="18" font-weight="600" fill="#1D1F23">${txt}</text>`; });
  labels += `</g><g font-family="Inter,Arial"><rect x="1440" y="930" width="420" height="90" fill="#fff" stroke="#1D1F23" stroke-width="1.5"/><line x1="1440" y1="962" x2="1860" y2="962" stroke="#1D1F23" stroke-width="1"/>
    <text x="1456" y="953" font-size="15" font-weight="800" fill="#530018" letter-spacing="1.5">KAHRAMAA · CONCEPT C1</text><text x="1456" y="990" font-size="17" font-weight="600" fill="#1D1F23">Side section · cleaning and filtration</text><text x="1456" y="1011" font-size="14" fill="#5C5759">Schematic, not to scale</text></g>`;
  const key = `<g font-family="Inter,Arial" font-size="19" font-weight="700"><rect x="1430" y="60" width="430" height="96" rx="10" fill="#fff" stroke="#DBDADA"/>
    <line x1="1455" y1="92" x2="1515" y2="92" stroke="#8A5A2B" stroke-width="10" stroke-linecap="round"/><text x="1530" y="99" fill="#1D1F23">Sediment slurry</text>
    <line x1="1455" y1="126" x2="1515" y2="126" stroke="#1F7FC4" stroke-width="10" stroke-linecap="round"/><text x="1530" y="133" fill="#1D1F23">Clarified water</text></g>`;
  return `<svg class="line" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><style>${CSS_LINE}</style>${g}${robotSVG('line')}${flows}${labels}${key}</svg>`;
}
