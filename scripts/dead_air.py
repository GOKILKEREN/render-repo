#!/usr/bin/env python3
"""Find dead space in a finished Short: one framing held too long with nothing new happening.

  dead_air.py CLIP.mp4 [--max 2.0]

The user's rule (2026-11-01): when the camera sits on one person (Kai staring at his wet leg while someone
off screen says "my bad"), hold it for 2 s at most, then cut - to the person talking, to whoever is laughing,
or to another moment. Lists every held shot (no cut, no zoom) longer than --max, with how much moves in it and
how loud the voices are, and marks:
  DEAD  little motion and quiet: cut it down to --max or drop it
  HOLD  long but busy / talky: check it is ON the person doing the thing; if they're off screen, reframe
        (spec `frame`) or cut
The ending (last ~2.8 s) is skipped. Map output seconds back to source seconds through the spec's segments.
"""
import subprocess
import sys

import numpy as np

try:
    import imageio_ffmpeg
    FF = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FF = "ffmpeg"
RATE, W, H = 10, 108, 192
CUT = 22.0          # mean abs frame difference (0-255) that counts as a cut or a zoom
END_S = 2.8


def measure(path):
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-vf", f"fps={RATE},scale={W}:{H},format=gray",
                          "-f", "rawvideo", "-"], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
    mot = np.r_[0, np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))]
    au = subprocess.run([FF, "-v", "error", "-i", path, "-af", "highpass=f=300,lowpass=f=3000", "-ac", "1",
                         "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    a = np.frombuffer(au, np.int16).astype(np.float32) / 32768
    hop = 16000 // RATE
    n = min(len(a) // hop, len(mot))
    db = 20 * np.log10(np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-6)
    return mot[:n], db


def main():
    path = sys.argv[1]
    mx = float(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else 2.0
    mot, db = measure(path)
    if len(mot) <= END_S * RATE:
        sys.exit(f"  could not read {path} (or it is shorter than the ending)")
    n = len(mot) - int(END_S * RATE)
    loud = np.percentile(db[:n], 90)
    bounds = [0] + [i for i in range(1, n) if mot[i] > CUT] + [n]
    found = False
    for i0, i1 in zip(bounds, bounds[1:]):
        if (i1 - i0) / RATE <= mx:
            continue
        m, v = np.median(mot[i0 + 1:i1]), np.median(db[i0:i1]) - loud
        tag = "DEAD" if m < 6 and v < -12 else "HOLD"
        found = True
        print(f"  {tag}  {i0 / RATE:5.1f}-{i1 / RATE:5.1f}s ({(i1 - i0) / RATE:4.1f}s)  motion {m:4.1f}  "
              f"voice {v:+5.1f} dB vs loudest")
    if not found:
        print(f"  no held shot longer than {mx:.1f}s")


if __name__ == "__main__":
    main()
