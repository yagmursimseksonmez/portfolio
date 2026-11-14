# Cuts the four Chengel design-system boards into their panels, so the case shows them stacked instead of one wide
# board that scrolls sideways (the recruiter report, 2026-11-13). Her boards are only cropped, never redrawn.
#
#   python3 tools/chengel/split-boards.py [out_dir]
#
# Reads public/images/chengel-ds-<board>.webp (2x, transparent; boards.mjs renders them) and writes
# chengel-ds-<board>-<panel>.webp next to them, or into out_dir. The x ranges are the gaps between panels in those
# boards: a new board render needs them checked again. Each panel is trimmed to what is drawn on it; frames.mjs `board()`
# takes the 1x sizes it prints.
import os, sys
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'images')
OUT = sys.argv[1] if len(sys.argv) > 1 else SRC
PANELS = {
    'colour': [('light', 0, 1284), ('dark', 1316, 2600)],
    'type': [('styles', 0, 1388), ('shape', 1420, 2600)],
    'components': [('atoms', 0, 789), ('molecules', 892, 2308), ('organisms', 2349, 3899)],
    'icons': [('set', 0, 1230), ('blooms', 1344, 1970)],
}
for board, panels in PANELS.items():
    im = Image.open(os.path.join(SRC, f'chengel-ds-{board}.webp')).convert('RGBA')
    for name, x0, x1 in panels:
        part = im.crop((x0, 0, x1, im.height))
        part = part.crop(part.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
        w, h = part.size
        part = part.crop((0, 0, w - w % 2, h - h % 2))  # even, so the 1x size is whole pixels
        part.save(os.path.join(OUT, f'chengel-ds-{board}-{name}.webp'), 'WEBP', quality=92, method=6)
        print(f'chengel-ds-{board}-{name}', part.size[0] // 2, part.size[1] // 2)
