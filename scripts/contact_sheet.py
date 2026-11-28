"""One frame per second of a video, tiled on one image, for checking every shot at a glance.

    python -I contact_sheet.py render.mp4 [--out sheet.png] [--fps 1] [--cols 14]

Writes next to the video by default (render_sheet.png). Look at every tile: subject readable, captions clear,
nothing clipped by close framing, each picture matching the line under it.
"""
import argparse
import math
import subprocess
from pathlib import Path

try:
    import imageio_ffmpeg
    FF = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FF = "ffmpeg"


def duration(path):
    err = subprocess.run([FF, "-i", str(path)], capture_output=True, text=True).stderr
    for line in err.splitlines():
        if "Duration:" in line:
            h, m, s = line.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise SystemExit(f"can't read {path}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("video")
    p.add_argument("--out")
    p.add_argument("--fps", type=float, default=1.0)
    p.add_argument("--cols", type=int, default=14)
    a = p.parse_args()
    v = Path(a.video)
    n = math.ceil(duration(v) * a.fps)
    rows = math.ceil(n / a.cols)
    out = a.out or str(v.with_name(v.stem + "_sheet.png"))
    subprocess.run([FF, "-loglevel", "error", "-y", "-i", str(v), "-vf",
                    f"fps={a.fps},scale=150:267,tile={a.cols}x{rows}", "-frames:v", "1", out], check=True)
    print(out, f"({n} frames, {a.cols}x{rows})")


if __name__ == "__main__":
    main()
