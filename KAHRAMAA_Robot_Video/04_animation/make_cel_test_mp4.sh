#!/usr/bin/env bash
# Encode the 10 s cel-shaded test (style C) to MP4 with the title card and TutorBin watermark.
# Frames: blender/renders/cel_test_v1/frames/0001-0240.png (24 fps, 1920x1080)
# Title card fades in at 0.4 s, holds, and fades out at 4.0-4.6 s. Watermark stays on for the whole clip.
set -euo pipefail
cd "$(dirname "$0")"
OUT=../05_output/KAHRAMAA_Robot_Cel_Test_10s_TutorBin.mp4
mkdir -p ../05_output
ffmpeg -y -loglevel error \
  -framerate 24 -i blender/renders/cel_test_v1/frames/%04d.png \
  -loop 1 -framerate 24 -i overlays/title_card.png \
  -loop 1 -framerate 24 -i overlays/watermark.png \
  -filter_complex "\
[1:v]format=rgba,fade=t=in:st=0.4:d=0.6:alpha=1,fade=t=out:st=4.0:d=0.6:alpha=1[title];\
[0:v][title]overlay=0:0:shortest=1[v1];\
[v1][2:v]overlay=0:0:shortest=1,format=yuv420p[v]" \
  -map "[v]" -frames:v 240 -c:v libx264 -preset slow -crf 18 -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of compact "$OUT"
