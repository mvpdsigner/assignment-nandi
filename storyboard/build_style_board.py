# Builds style_board.html: injects the Clean Flat (A) frames from storyboard_v3.html into style_board.src.html.
import pathlib
here = pathlib.Path(__file__).parent
v3 = (here / 'storyboard_v3.html').read_text()
src = (here / 'style_board.src.html').read_text()

def frame(code):
    i = v3.index(f'<span>{code}</span>')
    i = v3.index('<div class="frame">', i) + len('<div class="frame">')
    return v3[i:v3.index('</div>\n      <p>', i)]

for slot, code in (('{{A1}}', '1B'), ('{{A2}}', '4B'), ('{{A3}}', '6C')):
    src = src.replace(slot, frame(code))
(here / 'style_board.html').write_text(src)
